"use client";

import { useActionState, useState } from "react";
import { resetPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { calculatePasswordStrength } from "@/lib/password-strength";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPassword, undefined);
  const [password, setPassword] = useState("");

  const { meetsAllRequirements } = calculatePasswordStrength(password);

  return (
    <>
      <h1 className="text-xl font-semibold">Set a new password</h1>

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

        {state?.message && (
          <p className="text-sm text-destructive" role="alert">
            {state.message}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending || !meetsAllRequirements}>
          {pending ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </>
  );
}
