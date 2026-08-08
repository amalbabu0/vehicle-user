import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles both magic-link/password-reset redirects and Google OAuth's code
// exchange. No role logic here (unlike the admin app) — every account on
// this site is role='user' by default via the profiles trigger, and
// browsing is public regardless of role.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }

  if (next === "/reset-password") {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Google never hands back a phone number, and Google's own consent
  // screen doesn't ask "can this site use your name/photo" — that's asked
  // once, here, right after a brand-new Google sign-up (not on every
  // login). created_at/last_sign_in_at land within a couple seconds of
  // each other only on the very first session for an account — the
  // standard Supabase signal for "this account was just created" (no
  // separate DB flag needed).
  if (data.user.app_metadata?.provider === "google") {
    const createdAt = new Date(data.user.created_at).getTime();
    const lastSignInAt = data.user.last_sign_in_at ? new Date(data.user.last_sign_in_at).getTime() : createdAt;
    const isNewGoogleUser = Math.abs(lastSignInAt - createdAt) < 10_000;
    if (isNewGoogleUser) {
      return NextResponse.redirect(`${origin}/complete-profile`);
    }
  }

  await supabase.rpc("log_audit_event", {
    p_action: "login",
    p_entity_type: "auth",
    p_entity_id: data.user.id,
    p_metadata: { provider: "google" },
  });

  return NextResponse.redirect(`${origin}${next}`);
}
