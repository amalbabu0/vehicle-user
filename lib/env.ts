import "server-only";
import * as z from "zod";

/**
 * Server-side env schema for the User website.
 * This app is deliberately scoped to read-mostly access: no Supabase
 * service-role key, no Cloudflare upload token — only the anon key (RLS
 * grants it read on published listings + writes on the caller's own
 * favorites/enquiries/profile rows) and the public Images delivery hash.
 */
const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  NEXT_PUBLIC_CLOUDFLARE_IMAGES_HASH: z.string().min(1),

  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),

  SESSION_SECRET: z.string().min(32),

  NEXT_PUBLIC_SITE_URL: z.url(),
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
