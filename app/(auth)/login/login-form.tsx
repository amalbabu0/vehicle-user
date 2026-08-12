"use client";

import { Suspense, useActionState, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { GoogleIcon } from "@/components/google-icon";
import { login, signInWithGoogle } from "@/app/actions/auth";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Google sign-in failed. Please try again.",
  missing_code: "Sign-in link was invalid or expired.",
  verification_failed: "This verification link is invalid or has already been used. If you've already verified your account, just log in below.",
};

// useSearchParams() opts a component out of static prerendering unless
// wrapped in Suspense — isolated here so the rest of the page stays static.
function OAuthErrorBanner() {
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  if (!oauthError) return null;
  return (
    <p className="mt-4 text-sm text-destructive" role="alert">
      {OAUTH_ERROR_MESSAGES[oauthError] ?? "Something went wrong. Please try again."}
    </p>
  );
}

// Reads ?redirectTo=/somewhere (set by e.g. favorite-button.tsx before
// bouncing a signed-out visitor here) and threads it through as a hidden
// field — login() re-validates/sanitizes it server-side before ever using
// it, this is just plumbing, not the security boundary.
function RedirectToField() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  if (!redirectTo) return null;
  return <input type="hidden" name="redirectTo" value={redirectTo} />;
}

export function LoginForm() {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [state, formAction, pending] = useActionState(login, undefined);
  const [token, setToken] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  useEffect(() => {
    if (state?.message) {
      turnstileRef.current?.reset();
      setToken("");
    }
  }, [state]);

  // Move focus to the first invalid field so keyboard/screen-reader users
  // land directly on what needs fixing instead of having to hunt for it.
  // components/ui/input.tsx doesn't forward refs, so this goes through
  // the id instead rather than changing that shared primitive for every
  // other form that uses it.
  useEffect(() => {
    if (state?.errors?.email) document.getElementById("email")?.focus();
    else if (state?.errors?.password) document.getElementById("password")?.focus();
  }, [state]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/");
      }
    });
  }, [supabase, router]);

  return (
    <>
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        {/* The full brand badge rather than the 40px app icon — at this size
            the shield, wordmark and tagline are all actually readable, so the
            login screen identifies itself. Swapped by theme via CSS (not
            useTheme) so it renders correctly on the server pass too. */}
        <Image src="/branding/logo-light.webp" alt="Kerala Lease Hub" width={80} height={80} className="size-20 object-contain dark:hidden" priority />
        <Image src="/branding/logo-dark.webp" alt="Kerala Lease Hub" width={80} height={80} className="hidden size-20 object-contain dark:block" priority />
        <h1 className="text-xl font-semibold">Sign in</h1>
      </div>

      <Suspense fallback={null}>
        <OAuthErrorBanner />
      </Suspense>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="pl-9"
              aria-invalid={Boolean(state?.errors?.email)}
              aria-describedby={state?.errors?.email ? "email-error" : undefined}
              required
            />
          </div>
          {state?.errors?.email && (
            <p id="email-error" className="text-sm text-destructive">
              {state.errors.email[0]}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-muted-foreground text-xs hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              className="pl-9"
              aria-invalid={Boolean(state?.errors?.password)}
              aria-describedby={state?.errors?.password ? "password-error" : undefined}
              required
            />
          </div>
          {state?.errors?.password && (
            <p id="password-error" className="text-sm text-destructive">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        <input type="hidden" name="turnstileToken" value={token} />
        <Suspense fallback={null}>
          <RedirectToField />
        </Suspense>
        <TurnstileWidget ref={turnstileRef} action="login" onVerify={setToken} />

        {state?.message && (
          <div className="space-y-2" role="alert">
            {/* Not a genuine error — the account exists and the password
                was never even checked, Supabase blocks sign-in entirely
                pre-confirmation — so this reads as a next-step reminder,
                not a destructive/red failure. */}
            <p className={`text-sm ${state.emailUnconfirmed ? "text-muted-foreground" : "text-destructive"}`}>{state.message}</p>
            {state.accountMissing && (
              <Link href="/register" className="no-underline">
                <Button type="button" variant="outline" size="sm" className="w-full">
                  Register
                </Button>
              </Link>
            )}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="group w-full rounded-full"
          disabled={pending || !token}
          aria-label={pending ? "Logging in" : "Log in"}
        >
          {pending ? "Logging in…" : "Log in"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or</span>
        <div className="bg-border h-px flex-1" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="outline" className="w-full gap-3">
          <GoogleIcon className="size-5" />
          Continue with Google
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        New here?{" "}
        <Link href="/register" className="text-foreground hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
