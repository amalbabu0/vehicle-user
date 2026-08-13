import "server-only";

import type { NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public-client";

/**
 * Visitor IP logging for the admin app's "IP Logs" page.
 *
 * Called from proxy.ts inside event.waitUntil(), so the insert runs after the
 * response is on its way out and never adds latency to a page view. Uses the
 * anon client because this has to work for visitors with no session at all —
 * that is the whole point of the feature — and this app holds no service-role
 * key by design. See admin migration 0036 for the RLS shape (anon INSERT, no
 * anon SELECT) and the tradeoff that entails.
 */

/** Mirrors the length CHECKs in migration 0036. Postgres would reject an
 * over-long value outright, which in a fire-and-forget insert means the visit
 * is silently lost — clamping here keeps the row instead of the error. */
const MAX_LENGTH = { ip: 45, path: 512, userAgent: 512, referrer: 512 } as const;

function clamp(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}

/**
 * Which requests count as a visit.
 *
 * The proxy matcher already filters out _next/static, images and favicon, so
 * this only has to exclude things that reach app routes but aren't a person
 * looking at a page:
 *
 *  - Prefetches. Next hovers/viewport-prefetches every <Link>, so a single
 *    homepage view would otherwise log a row per card on screen. These carry
 *    `next-router-prefetch`. Soft navigations (`rsc` without the prefetch
 *    header) are kept — those are real page views.
 *  - API and auth-callback traffic, which is machinery rather than browsing.
 *  - Anything with a file extension (robots.txt, sitemap.xml, .well-known),
 *    which is crawler/infra plumbing and would drown the log.
 */
export function shouldLogVisit(request: NextRequest): boolean {
  if (request.method !== "GET") return false;
  if (request.headers.get("next-router-prefetch")) return false;
  if (request.headers.get("purpose") === "prefetch") return false;

  const path = request.nextUrl.pathname;
  if (path.startsWith("/api/") || path.startsWith("/auth/") || path.startsWith("/_next/")) return false;
  if (/\.[a-z0-9]+$/i.test(path)) return false;

  return true;
}

/** x-forwarded-for is a client-to-proxy chain; the first entry is the caller.
 * Vercel also sets x-real-ip. "unknown" rather than skipping the row, so the
 * log still records that a visit happened — matching how the auth actions
 * already record IPs (app/actions/auth.ts). */
function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function recordVisit(request: NextRequest, isAuthenticated: boolean): Promise<void> {
  try {
    const supabase = createPublicClient();
    await supabase.from("visitor_logs").insert({
      ip: clamp(clientIp(request), MAX_LENGTH.ip)!,
      path: clamp(request.nextUrl.pathname, MAX_LENGTH.path)!,
      user_agent: clamp(request.headers.get("user-agent"), MAX_LENGTH.userAgent),
      referrer: clamp(request.headers.get("referer"), MAX_LENGTH.referrer),
      country: request.headers.get("x-vercel-ip-country"),
      is_authenticated: isAuthenticated,
    });
  } catch {
    // Swallowed deliberately. This runs detached from the response, so there
    // is no caller to surface an error to, and a logging failure must never
    // be able to take down a page view of the public site.
  }
}
