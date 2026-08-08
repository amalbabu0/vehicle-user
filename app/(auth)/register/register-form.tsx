"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { register, signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { PhoneInput } from "@/components/phone-input";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/turnstile-widget";
import { calculatePasswordStrength } from "@/lib/password-strength";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, undefined);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const { meetsAllRequirements } = calculatePasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 ? confirmPassword === password : null;

  const succeeded = Boolean(state?.message && !state.errors && state.message.startsWith("Check your email"));

  useEffect(() => {
    if (state?.message && !succeeded) {
      turnstileRef.current?.reset();
      setToken("");
    }
  }, [state, succeeded]);

  if (succeeded) {
    return (
      <>
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-muted-foreground mt-2 text-sm">{state?.message}</p>
        <Link href="/login" className="mt-6 block">
          <Button variant="outline" className="w-full">
            Back to sign in
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold">Create an account</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Save favorites, message listers, and track your enquiries.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" required />
          {state?.errors?.fullName && (
            <p className="text-sm text-destructive">{state.errors.fullName[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          {state?.errors?.email && (
            <p className="text-sm text-destructive">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Mobile number</Label>
          <PhoneInput id="phone" name="phone" required aria-invalid={Boolean(state?.errors?.phone)} />
          {state?.errors?.phone && (
            <p className="text-sm text-destructive">{state.errors.phone[0]}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
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

        <input type="hidden" name="turnstileToken" value={token} />
        <TurnstileWidget ref={turnstileRef} action="register" onVerify={setToken} />

        {state?.message && (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={pending || !token || !meetsAllRequirements || !passwordsMatch}
        >
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">or</span>
        <div className="bg-border h-px flex-1" />
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="outline" className="w-full">
          Continue with Google
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
