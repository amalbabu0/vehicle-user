import "server-only";

import type { NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public-client";
import { env } from "@/lib/env";

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

/**
 * cf-connecting-ip first, and that order is not incidental.
 *
 * keralaleasehub.online is proxied through Cloudflare in front of Vercel, so
 * the connection Vercel terminates comes from a Cloudflare edge node — which
 * means x-forwarded-for's first entry is that edge, not the visitor. This was
 * not theoretical: the first row this feature ever wrote logged
 * 162.158.54.161, a Cloudflare range, for a visit from an ordinary browser.
 * Left as-is, every visitor would have shown up as one of a handful of
 * rotating Cloudflare addresses and the log would have been worthless.
 *
 * Cloudflare sets cf-connecting-ip to the real client address on every
 * proxied request, overwriting any value a client tries to supply, so it is
 * trustworthy as long as traffic actually arrives through Cloudflare. It
 * could be spoofed by reaching the Vercel origin directly and bypassing the
 * proxy — acceptable for a visit log, and the reason this is not used for
 * anything that gates access.
 *
 * The x-forwarded-for/x-real-ip fallback keeps this working if the domain is
 * ever taken off the Cloudflare proxy. "unknown" rather than dropping the
 * row, so the log still records that a visit happened — matching how the auth
 * actions already record IPs (app/actions/auth.ts).
 */
export function clientIp(request: NextRequest): string {
  const cloudflare = request.headers.get("cf-connecting-ip")?.trim();
  if (cloudflare) return cloudflare;

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Goes through the record_visit() RPC rather than inserting directly.
 *
 * The table no longer accepts an anon INSERT: an unconditional insert policy
 * meant anyone holding the public anon key could attribute hostile-looking
 * traffic to an address of their choosing, and once the admin app grew a Block
 * button that stopped being merely noisy — it became a way to get an innocent
 * visitor blocked. The RPC takes a token this app holds server-side, which
 * never reaches a browser. See admin migration 0040.
 *
 * No token configured means no logging. Deliberate: an empty log is a
 * recoverable misconfiguration, an open one is not.
 */
export async function recordVisit(request: NextRequest, isAuthenticated: boolean): Promise<void> {
  if (!env.VISITOR_LOG_TOKEN) return;

  try {
    const supabase = createPublicClient();
    await supabase.rpc("record_visit", {
      p_token: env.VISITOR_LOG_TOKEN,
      p_ip: clamp(clientIp(request), MAX_LENGTH.ip)!,
      p_path: clamp(request.nextUrl.pathname, MAX_LENGTH.path)!,
      p_user_agent: clamp(request.headers.get("user-agent"), MAX_LENGTH.userAgent),
      p_referrer: clamp(request.headers.get("referer"), MAX_LENGTH.referrer),
      // cf-ipcountry before Vercel's equivalent for the same reason as the IP
      // above: x-vercel-ip-country geolocates whoever connected to Vercel,
      // which behind the Cloudflare proxy is the edge node rather than the
      // visitor. Cloudflare resolves it from the real client address.
      p_country: clamp(request.headers.get("cf-ipcountry") ?? request.headers.get("x-vercel-ip-country"), 2),
      p_is_authenticated: isAuthenticated,
    });
  } catch {
    // Swallowed deliberately. This runs detached from the response, so there
    // is no caller to surface an error to, and a logging failure must never
    // be able to take down a page view of the public site.
  }
}
