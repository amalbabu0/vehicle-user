"use server";

import * as z from "zod";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { createClient } from "@/lib/supabase/server";
import { verifySession } from "@/lib/auth/dal";

const nameSchema = z.string().trim().min(2, { error: "Name must be at least 2 characters." }).max(100, { error: "Name is too long." });
const phoneSchema = z.string().trim().refine((value) => isValidPhoneNumber(value), { error: "Enter a valid mobile number." });
const passwordSchema = z.string().min(8, { error: "Be at least 8 characters long." }).regex(/[a-zA-Z]/, { error: "Contain at least one letter." }).regex(/[0-9]/, { error: "Contain at least one number." }).regex(/[^a-zA-Z0-9]/, { error: "Contain at least one special character." });

export type SettingsActionState = { message?: string; error?: string; field?: string } | undefined;

async function verifyCurrentPassword(password: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Your session has expired. Please sign in again." };
  const { error } = await supabase.auth.signInWithPassword({ email: user.email, password });
  return error ? { error: "Your current password is incorrect." } : {};
}

export async function updateName(_previous: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, field: "name" };
  const user = await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").update({ full_name: parsed.data }).eq("id", user.id);
  return error ? { error: "Could not update your name. Please try again." } : { message: "Name updated successfully." };
}

export async function updatePhone(_previous: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const parsed = phoneSchema.safeParse(formData.get("phone"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, field: "phone" };
  const user = await verifySession();
  const supabase = await createClient();
  const { error } = await supabase.from("user_profiles").update({ phone: parsed.data }).eq("id", user.id);
  return error ? { error: "Could not update your phone number. Please try again." } : { message: "Phone number updated successfully." };
}

export async function changePassword(_previous: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  await verifySession();
  const current = z.string().min(1, { error: "Enter your current password." }).safeParse(formData.get("currentPassword"));
  const next = passwordSchema.safeParse(formData.get("newPassword"));
  if (!current.success) return { error: current.error.issues[0]?.message, field: "currentPassword" };
  if (!next.success) return { error: next.error.issues[0]?.message, field: "newPassword" };
  if (next.data !== formData.get("confirmPassword")) return { error: "New passwords do not match.", field: "confirmPassword" };
  if (next.data === current.data) return { error: "Choose a new password that differs from the current one.", field: "newPassword" };
  const verified = await verifyCurrentPassword(current.data);
  if (verified.error) return verified;
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: next.data });
  return error ? { error: error.message } : { message: "Password updated successfully." };
}

export async function changeEmail(_previous: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  await verifySession();
  const email = z.email({ error: "Enter a valid email address." }).safeParse(formData.get("email"));
  const current = z.string().min(1, { error: "Enter your current password." }).safeParse(formData.get("currentPassword"));
  if (!email.success) return { error: email.error.issues[0]?.message, field: "email" };
  if (!current.success) return { error: current.error.issues[0]?.message, field: "emailCurrentPassword" };
  const verified = await verifyCurrentPassword(current.data);
  if (verified.error) return verified;
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: email.data });
  return error ? { error: error.message } : { message: "Check your email to confirm the new address." };
}
