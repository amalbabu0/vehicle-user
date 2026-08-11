"use server";

import * as z from "zod";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidPhoneNumber } from "libphonenumber-js/min";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { checkAuthRateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import type { Json } from "@/lib/supabase/database.types";

// ============================================================================
// Schemas
// ============================================================================

const passwordSchema = z
  .string()
  .min(8, { error: "Be at least 8 characters long." })
  .regex(/[a-zA-Z]/, { error: "Contain at least one letter." })
  .regex(/[0-9]/, { error: "Contain at least one number." })
  .regex(/[^a-zA-Z0-9]/, { error: "Contain at least one special character." });

// Shared by register() and completeProfile() (the Google-onboarding flow)
// — both now collect phone via components/phone-input.tsx, which submits
// one already-E.164-formatted value (e.g. "+919876543210": country
// selector + national number combined client-side). isValidPhoneNumber()
// is the same library the picker's country/calling-code list comes from,
// so client and server agree on what counts as valid without a second,
// hand-rolled set of per-country rules.
const phoneSchema = z
  .string()
  .trim()
  .refine((value) => isValidPhoneNumber(value), { error: "Enter a valid mobile number." });

const registerSchema = z.object({
  fullName: z.string().min(2, { error: "Name must be at least 2 characters." }).trim(),
  email: z.email({ error: "Enter a valid email address." }).trim(),
  phone: phoneSchema,
  password: passwordSchema,
  turnstileToken: z.string().min(1, { error: "Complete the verification challenge." }),
});

const loginSchema = z.object({
  // Distinct "required" vs "invalid format" messages (spec asks for both,
  // and z.email() alone only ever produces the second — an empty string
  // fails email-format validation too, so without the .min(1) check first
  // it would wrongly say "Enter a valid email address" for a blank field).
  email: z
    .string()
    .trim()
    .min(1, { error: "Email is required." })
    .pipe(z.email({ error: "Enter a valid email address." })),
  password: z.string().min(1, { error: "Password is required." }),
  turnstileToken: z.string().min(1, { error: "Complete the verification challenge." }),
  // Where to send the user after a successful login — validated/sanitized
  // in login() itself (sanitizeRedirect), never trusted as-is. Optional:
  // most logins don't arrive via a redirectTo-tagged link.
  redirectTo: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.email({ error: "Enter a valid email address." }).trim(),
  turnstileToken: z.string().min(1, { error: "Complete the verification challenge." }),
});

const resetPasswordSchema = z.object({
  password: passwordSchema,
});

const completeProfileSchema = z.object({
  phone: phoneSchema,
  consent: z.literal("true", { error: "Please confirm you agree before continuing." }),
});

export type ActionState = {
  errors?: Record<string, string[]>;
  message?: string;
  /** Set by login() specifically for "no account with this email" — lets
   * the form show a Register action alongside the message instead of just
   * plain text. */
  accountMissing?: boolean;
  /** Set by login() when the account exists and the password was never
   * even checked — Supabase blocks sign-in entirely pre-confirmation, so
   * this is not a "wrong password" case and shouldn't be worded like one. */
  emailUnconfirmed?: boolean;
} | undefined;

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Only ever allow redirecting back to a same-origin relative path — never
 * an absolute URL or a protocol-relative one (`//evil.com` parses as a
 * scheme-relative URL that browsers treat as external), which is what an
 * attacker-crafted `?redirectTo=` would otherwise let through. */
function sanitizeRedirect(path: string | undefined | null): string {
  if (!path) return "/";
  // Exactly one leading slash, then a character that isn't / or \ — blocks
  // "//evil.com" (scheme-relative) and "/\evil.com" (some browsers treat
  // a leading backslash as a forward slash, a known open-redirect bypass).
  if (!/^\/[^/\\]/.test(path)) return "/";
  return path;
}

async function logAuditEvent(action: string, entityId?: string, metadata: Record<string, Json> = {}) {
  const supabase = await createClient();
  await supabase.rpc("log_audit_event", {
    p_action: action,
    p_entity_type: "auth",
    p_entity_id: entityId,
    p_metadata: metadata,
  });
}

// ============================================================================
// register — defaults to role='user' via the profiles trigger, no special
// assignment needed (unlike the admin app's lister/bootstrap-admin logic).
// ============================================================================

export async function register(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validated = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    turnstileToken: formData.get("turnstileToken"),
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors as Record<string, string[]> };
  }

  const ip = await clientIp();
  const withinLimit = await checkAuthRateLimit("register", ip, validated.data.email);
  if (!withinLimit) {
    return { message: "Too many attempts. Try again in a few minutes." };
  }

  const humanVerified = await verifyTurnstileToken(validated.data.turnstileToken, "register", ip);
  if (!humanVerified) {
    return { message: "Verification failed. Please try again." };
  }

  const { fullName, email, phone, password } = validated.data;
  const supabase = await createClient();

  // phone travels through raw_user_meta_data the same way full_name
  // already does — handle_new_user() reads both when it creates the
  // user_profiles row (see admin migration 0025), because there's no
  // session yet to do a direct RLS-scoped update with (email confirmation
  // is required, so signUp() returns a user but no session until they
  // click the link).
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      emailRedirectTo: `${env.SITE_URL}/auth/callback?next=/accountt-verifed`,
    },
  });

  // Generic on failure, same as forgotPassword() below — Supabase's own
  // error text differs for "email already registered" vs. other failures,
  // which would otherwise turn this into an account-enumeration oracle.
  if (error) {
    return { message: "Something went wrong. If you already have an account, try signing in instead." };
  }

  if (data.user) {
    await logAuditEvent("register", data.user.id, { email });
  }

  return { message: "Check your email to verify your account before signing in." };
}

// ============================================================================
// login
// ============================================================================

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validated = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    turnstileToken: formData.get("turnstileToken"),
    redirectTo: formData.get("redirectTo") || undefined,
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors as Record<string, string[]> };
  }

  const ip = await clientIp();
  const withinLimit = await checkAuthRateLimit("login", ip, validated.data.email);
  if (!withinLimit) {
    return { message: "Too many attempts. Try again in a few minutes." };
  }

  const humanVerified = await verifyTurnstileToken(validated.data.turnstileToken, "login", ip);
  if (!humanVerified) {
    return { message: "Verification failed. Please try again." };
  }

  const { email, password, redirectTo } = validated.data;
  const supabase = await createClient();

  // Deliberate product choice, not an oversight: distinguishing "no
  // account" from "wrong password" trades a small amount of account-
  // enumeration surface for clearer UX. Kept as safe as the tradeoff
  // allows — email_has_account() is a narrow RPC returning only a
  // boolean (see admin migration 0024), and this whole action is already
  // behind the IP rate limit + Turnstile check above regardless of which
  // branch runs next.
  let accountExists: boolean;
  try {
    const { data: exists, error: lookupError } = await supabase.rpc("email_has_account", { p_email: email });
    if (lookupError) {
      return { message: "Unable to log in right now. Please try again." };
    }
    accountExists = Boolean(exists);
  } catch {
    return { message: "Something went wrong. Please check your connection and try again." };
  }

  if (!accountExists) {
    return { message: "Account doesn't exist. Please register.", accountMissing: true };
  }

  let signInResult;
  try {
    signInResult = await supabase.auth.signInWithPassword({ email, password });
  } catch {
    return { message: "Something went wrong. Please check your connection and try again." };
  }

  if (signInResult.error) {
    if (signInResult.error.code === "email_not_confirmed") {
      return { message: "Please check your email and verify your account before signing in.", emailUnconfirmed: true };
    }
    return { message: "Email or password is incorrect." };
  }

  await logAuditEvent("login", signInResult.data.user.id);
  redirect(sanitizeRedirect(redirectTo));
}

// ============================================================================
// logout
// ============================================================================

export async function logout() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    await logAuditEvent("logout", user.id);
  }
  await supabase.auth.signOut();
  redirect("/");
}

// ============================================================================
// forgot / reset password
// ============================================================================

export async function forgotPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validated = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
    turnstileToken: formData.get("turnstileToken"),
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors as Record<string, string[]> };
  }

  const ip = await clientIp();
  const withinLimit = await checkAuthRateLimit("forgot", ip, validated.data.email);
  if (!withinLimit) {
    return { message: "Too many attempts. Try again in a few minutes." };
  }

  const humanVerified = await verifyTurnstileToken(validated.data.turnstileToken, "forgot_password", ip);
  if (!humanVerified) {
    return { message: "Verification failed. Please try again." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(validated.data.email, {
    redirectTo: `${env.SITE_URL}/auth/callback?next=/reset-password`,
  });

  return { message: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPassword(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validated = resetPasswordSchema.safeParse({ password: formData.get("password") });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Your reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: validated.data.password });
  if (error) {
    return { message: error.message };
  }

  await logAuditEvent("password_reset", user.id);
  redirect("/login");
}

// ============================================================================
// Google OAuth
// ============================================================================

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${env.SITE_URL}/auth/callback` },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth_failed");
  }

  redirect(data.url);
}

// ============================================================================
// complete-profile (post Google sign-up: phone + name/photo consent)
// ============================================================================

export async function completeProfile(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validated = completeProfileSchema.safeParse({
    phone: formData.get("phone"),
    consent: formData.get("consent"),
  });

  if (!validated.success) {
    return { errors: z.flattenError(validated.error).fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { message: "Your session expired. Please sign in again." };
  }

  const { error } = await supabase
    .from("user_profiles")
    .update({
      phone: validated.data.phone,
      profile_image_consent: true,
      profile_image_consent_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { message: "Couldn't save your details. Please try again." };
  }

  redirect("/");
}
