import "server-only";
import * as z from "zod";

/**
 * Server-side env schema for the User website.
 * This app is deliberately scoped to read-mostly access: no Supabase
 * service-role key, no R2 write credentials — only the anon key (RLS
 * grants it read on published listings + writes on the caller's own
 * favorites/enquiries/profile rows) and the public images CDN URL.
 *
 * None of these are NEXT_PUBLIC_-prefixed, including the 5 that the browser
 * ultimately needs (SUPABASE_URL, SUPABASE_ANON_KEY, IMAGES_CDN_URL,
 * TURNSTILE_SITE_KEY, SITE_URL). Those 5 are handed to the client at runtime
 * via app/api/public-config/route.ts instead of being inlined into the JS
 * bundle at build time — see components/providers and lib/config. This does
 * not make them secret (the browser still receives them), it only changes
 * *when* and *how* — they're meant to be visible to visitors either way.
 *
 * Images live in Cloudflare R2 (see admin app for why, not Cloudflare
 * Images). This app only ever gets the public custom-domain CDN URL —
 * no R2 access keys, no upload path, matching the read-only split.
 */
const envSchema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),

  // Public custom domain connected to the R2 bucket, e.g. https://cdn.example.com
  IMAGES_CDN_URL: z.url(),

  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),

  // Normalized to strip any trailing slash: every call site does
  // `${env.SITE_URL}/path`, and a trailing slash here produces a literal
  // double slash (".online//auth/callback...") that doesn't string-match
  // Supabase's redirect URL allow-list — a real bug, not cosmetic, since
  // Supabase falls back to the bare Site URL for anything it doesn't
  // recognize (this is why password-reset/confirm-signup/Google-login
  // links were landing on the homepage instead of their real destination).
  SITE_URL: z.url().transform((url) => url.replace(/\/+$/, "")),

  // Shared secret with the admin app — lets it call /api/revalidate to
  // instantly refresh a cached vehicle page after a publish/status change,
  // instead of waiting out the `revalidate` window. Never exposed to the
  // browser.
  REVALIDATE_SECRET: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid/missing environment variables in user app:\n${issues}\n\nCopy .env.example to .env.local and fill in real values.`
    );
  }
  return parsed.data;
}

export const env = loadEnv();
