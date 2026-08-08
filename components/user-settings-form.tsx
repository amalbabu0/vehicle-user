"use client";

import { useActionState, useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";
import { changeEmail, changePassword, updateName, updatePhone } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/password-input";
import { PasswordStrengthIndicator } from "@/components/password-strength-indicator";
import { PhoneInput } from "@/components/phone-input";

function Feedback({ message, error }: { message?: string; error?: string }) {
  return message || error ? <p role="status" className={error ? "text-sm text-destructive" : "text-sm text-emerald-600 dark:text-emerald-400"}>{error ?? message}</p> : null;
}

function SaveButton({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return <Button type="submit" disabled={pending}>{pending && <LoaderCircle className="size-4 animate-spin" />}{pending ? "Saving…" : children}</Button>;
}

function ExpandableCard({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = `settings-${title.toLowerCase().replaceAll(" ", "-")}`;
  return <Card><button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={id} className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left hover:bg-muted/50"><span><span className="block font-medium">{title}</span>{description && <span className="mt-1 block text-sm text-muted-foreground">{description}</span>}</span><ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} /></button>{open && <CardContent id={id} className="border-t pt-4">{children}</CardContent>}</Card>;
}

export function UserSettingsForm({ name, phone, email }: { name: string | null; phone: string | null; email: string }) {
  const [nameState, nameAction, namePending] = useActionState(updateName, undefined);
  const [phoneState, phoneAction, phonePending] = useActionState(updatePhone, undefined);
  const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, undefined);
  const [emailState, emailAction, emailPending] = useActionState(changeEmail, undefined);
  const [newPassword, setNewPassword] = useState("");

  return <div className="space-y-6"><section className="space-y-3"><div><h2 className="text-base font-semibold">Profile</h2><p className="text-sm text-muted-foreground">Keep your contact details up to date.</p></div><ExpandableCard title="Name"><form action={nameAction} className="space-y-3"><div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={name ?? ""} required maxLength={100} aria-invalid={nameState?.field === "name"} /></div><Feedback {...nameState} /><SaveButton pending={namePending}>Save Changes</SaveButton></form></ExpandableCard><ExpandableCard title="Phone Number"><form action={phoneAction} className="space-y-3"><div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><PhoneInput id="phone" name="phone" defaultValue={phone} required aria-invalid={phoneState?.field === "phone"} /></div><Feedback {...phoneState} /><SaveButton pending={phonePending}>Save Changes</SaveButton></form></ExpandableCard></section><section className="space-y-3"><div><h2 className="text-base font-semibold">Security</h2><p className="text-sm text-muted-foreground">Changes require your current password.</p></div><ExpandableCard title="Change Password" description="Use at least 8 characters with a letter, number, and special character."><form action={passwordAction} className="space-y-4"><div className="space-y-2"><Label htmlFor="currentPassword">Current Password</Label><PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" required /></div><div className="space-y-2"><Label htmlFor="newPassword">New Password</Label><PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div><PasswordStrengthIndicator password={newPassword} /><div className="space-y-2"><Label htmlFor="confirmPassword">Confirm New Password</Label><PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required /></div><Feedback {...passwordState} /><SaveButton pending={passwordPending}>Update Password</SaveButton></form></ExpandableCard><ExpandableCard title="Change Email" description={<>Your current email is {email}. We will send confirmation instructions to complete the change.</>}><form action={emailAction} className="space-y-4"><div className="space-y-2"><Label htmlFor="email">New Email</Label><Input id="email" name="email" type="email" autoComplete="email" required aria-invalid={emailState?.field === "email"} /></div><div className="space-y-2"><Label htmlFor="emailCurrentPassword">Current Password</Label><PasswordInput id="emailCurrentPassword" name="currentPassword" autoComplete="current-password" required /></div><Feedback {...emailState} /><SaveButton pending={emailPending}>Change Email</SaveButton></form></ExpandableCard></section></div>;
}
