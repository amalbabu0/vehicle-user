import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";
import { clientIp, recordVisit, shouldLogVisit } from "@/lib/visitor-log";
import { isIpBlocked } from "@/lib/ip-block";

// Next.js 16 renamed Middleware to Proxy (same runtime/conventions). This
// refreshes the Supabase session cookie and does one small optimistic
// redirect: signed-in users shouldn't see the login/register forms. Most of
// this site is public (browse/search/vehicle details) — the opposite of the
// admin app's deny-by-default proxy. Add routes to PROTECTED_PATHS as they
// land (favorites, enquiries, profile, settings) — real enforcement is
// always the DAL (lib/auth/dal.ts) + RLS, this is only a UX shortcut.
const AUTH_PATHS = ["/login", "/register"];
const PROTECTED_PATHS: string[] = [
  "/favorites",
  // "/enquiries", "/profile", "/settings" — added when built
];

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Some Supabase OAuth redirect configs land on "/" with ?code=... instead
  // of /auth/callback directly. Catching this here (not in app/page.tsx,
  // which used to read searchParams itself) means the homepage no longer
  // needs to read searchParams at all, which is what let it become a fully
  // static/cacheable route — see PERFORMANCE.md.
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const code = request.nextUrl.searchParams.get("code")!;
    const next = request.nextUrl.searchParams.get("next");
    const callbackUrl = new URL("/auth/callback", request.url);
    callbackUrl.searchParams.set("code", code);
    if (next) callbackUrl.searchParams.set("next", next);
    return NextResponse.redirect(callbackUrl);
  }

  // Blocklist first, before the session lookup and before any logging. An
  // address an admin has flagged as a threat should cost this app as little as
  // possible: no Supabase auth round trip, and no visitor_logs row either —
  // otherwise anyone hammering the site would fill the very log the admin uses
  // to spot them. 403 rather than a redirect, since there is nowhere useful to
  // send them.
  if (await isIpBlocked(clientIp(request))) {
    return new NextResponse("Access denied.", {
      status: 403,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Visitor IP log for the admin app's IP Logs page. waitUntil keeps the
  // insert off the response path — the visitor never waits on it — and this
  // sits before the redirect branches below so a request that gets bounced to
  // /login still counts as a visit. `user` is already resolved above for the
  // auth redirects, so recording whether the visitor was signed in is free.
  if (shouldLogVisit(request)) {
    event.waitUntil(recordVisit(request, Boolean(user)));
  }

  if (user && AUTH_PATHS.some((p) => path === p)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!user && PROTECTED_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", path);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/public-config|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
