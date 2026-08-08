"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { resetPassword } from "@/app/actions/auth";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { calculatePasswordStrength } from "@/lib/password-strength";

// The recovery session behind this page is meant for one thing — setting a
// new password right after clicking the email link — not to sit open
// indefinitely on a shared/unattended device. 10 minutes, matching the
// OTP code window used elsewhere in this app.
const TIMEOUT_SECONDS = 10 * 60;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [state, formAction, pending] = useActionState(resetPassword, undefined);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(TIMEOUT_SECONDS);

  const { meetsAllRequirements } = calculatePasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 ? confirmPassword === password : null;

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (secondsLeft > 0 || !supabase) return;
    supabase.auth.signOut().finally(() => {
      router.replace("/forgot-password?expired=1");
    });
  }, [secondsLeft, supabase, router]);

  const expiringSoon = secondsLeft <= 60;

  return (
    <>
      <h1 className="text-xl font-semibold">Set a new password</h1>
      <p className={`mt-1 text-xs ${expiringSoon ? "text-destructive" : "text-muted-foreground"}`} aria-live="polite">
        This page expires in {formatTime(secondsLeft)} — request a new link if it does.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {state?.errors?.password && (
            <ul className="text-sm text-destructive list-inside list-disc">
              {state.errors.password.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
          <PasswordStrengthIndicator password={password} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {passwordsMatch !== null && (
            <p
              aria-live="polite"
              className={`flex items-center gap-1.5 text-xs ${passwordsMatch ? "text-emerald-600 dark:text-emerald-500" : "text-destructive"}`}
            >
              {passwordsMatch ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </p>
          )}
        </div>

        {state?.message && (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={pending || !meetsAllRequirements || !passwordsMatch}
        >
          {pending ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </>
  );
}
