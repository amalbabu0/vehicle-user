import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Anon-key client with NO cookie access — deliberately not built on
 * @supabase/ssr's createServerClient, which calls cookies() internally and
 * therefore opts the whole route out of static rendering (Next.js treats
 * any use of a Dynamic API anywhere in a route's render tree as reason to
 * render that route fresh on every request, ignoring `export const
 * revalidate`). Every page here renders Navbar, which needs session state,
 * so before this split *every* page — including ones with no personalized
 * content at all — was forced dynamic just by transitively calling
 * lib/supabase/server.ts's createClient().
 *
 * Use this for reads that don't depend on who's asking: vehicle listings,
 * brands/categories/locations, site_settings. RLS still applies (this is
 * still the anon role) — it just can't see anything gated to a specific
 * signed-in user, which none of these reads need anyway. Session-dependent
 * reads (favorites, "am I signed in") must keep using
 * lib/supabase/server.ts's cookie-bound client.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}
