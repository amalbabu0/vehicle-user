import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

export async function proxy(request: NextRequest) {
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
