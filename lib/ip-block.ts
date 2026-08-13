import "server-only";

import { createPublicClient } from "@/lib/supabase/public-client";

/**
 * Blocklist check for the proxy.
 *
 * Unlike the visitor log, this cannot be deferred with waitUntil — the answer
 * decides whether the request is served at all, so it sits on the critical
 * path of every page view. Two things keep that affordable:
 *
 *  1. An in-process cache. Serverless instances are reused across requests, so
 *     a visitor browsing several pages pays for one lookup, not one per page.
 *  2. The RPC is a primary-key existence check returning a boolean — see
 *     admin migration 0038 for why it is a SECURITY DEFINER function rather
 *     than the site reading the table (the blocklist is other people's IP
 *     addresses, and the anon key is public).
 */

const CACHE_TTL_MS = 60_000;

/** Bounded so a flood of distinct addresses can't grow this without limit in a
 * long-lived instance. Blunt clear rather than LRU eviction: at this size the
 * whole cache refills in a minute anyway, and the simpler rule has no
 * bookkeeping to get wrong. */
const MAX_CACHE_ENTRIES = 5_000;

const cache = new Map<string, { blocked: boolean; expiresAt: number }>();

export async function isIpBlocked(ip: string): Promise<boolean> {
  // The visitor log writes "unknown" when no forwarded header arrives. It is
  // not an address and must never match a block, or one row would lock out
  // every visitor whose IP could not be read.
  if (!ip || ip === "unknown") return false;

  const now = Date.now();
  const cached = cache.get(ip);
  if (cached && cached.expiresAt > now) return cached.blocked;

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.rpc("is_ip_blocked", { p_ip: ip });

    // Fail open, and deliberately so: if the database is unreachable or the
    // RPC errors, the choice is between letting a handful of blocked
    // addresses through and taking the entire public site offline for
    // everyone. A blocklist is a nuisance filter, not an authorization
    // boundary — nothing behind it is protected by this check alone.
    if (error) return false;

    const blocked = data === true;
    if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
    cache.set(ip, { blocked, expiresAt: now + CACHE_TTL_MS });
    return blocked;
  } catch {
    return false;
  }
}
