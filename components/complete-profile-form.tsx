"use client";

import { useActionState, useState } from "react";
import { completeProfile } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhoneInput } from "@/components/phone-input";

export function CompleteProfileForm({
  fullName,
  avatarUrl,
}: {
  fullName: string | null;
  avatarUrl: string | null;
}) {
  const [state, formAction, pending] = useActionState(completeProfile, undefined);
  const [consent, setConsent] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar className="size-16">
          <AvatarImage src={avatarUrl ?? undefined} alt={fullName ?? "Profile photo"} />
          <AvatarFallback className="text-lg">{(fullName ?? "?").charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        {fullName ? <p className="text-sm font-medium">{fullName}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Mobile number</Label>
        <PhoneInput id="phone" name="phone" required aria-invalid={Boolean(state?.errors?.phone)} />
        {state?.errors?.phone && <p className="text-sm text-destructive">{state.errors.phone[0]}</p>}
      </div>

      <div className="flex items-start gap-2.5">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(value) => setConsent(value === true)}
          className="mt-0.5"
        />
        <input type="hidden" name="consent" value={consent ? "true" : "false"} />
        <Label htmlFor="consent" className="text-sm leading-snug font-normal text-muted-foreground">
          I agree Kerala Lease Hub can use my Google name and profile photo on my account.
        </Label>
      </div>
      {state?.errors?.consent && <p className="text-sm text-destructive">{state.errors.consent[0]}</p>}

      {state?.message && (
        <p className="text-sm text-destructive" role="alert">
          {state.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending || !consent}>
        {pending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}
