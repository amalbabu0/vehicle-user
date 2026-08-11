import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

/** 5 attempts per 5 minutes per IP — login/register/forgot-password. */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "5 m"),
  prefix: "ratelimit:auth",
  analytics: true,
});

export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; remaining: number }> {
  const { success, remaining } = await limiter.limit(identifier);
  return { success, remaining };
}

// IP-only keys let a distributed attacker (many IPs) keep grinding one
// target email, since each IP gets its own fresh 5-attempt budget. Keying
// on the email too closes that: either budget running out blocks the
// attempt, regardless of how many IPs are spreading the load.
export async function checkAuthRateLimit(action: string, ip: string, email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const [byIp, byEmail] = await Promise.all([
    checkRateLimit(authRateLimit, `${action}:${ip}`),
    checkRateLimit(authRateLimit, `${action}:email:${normalizedEmail}`),
  ]);
  return byIp.success && byEmail.success;
}
