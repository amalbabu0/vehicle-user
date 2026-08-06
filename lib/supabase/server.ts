import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Request-scoped Supabase client for Server Components/Actions/Route
 * Handlers, bound to the current visitor's session cookie. Anon key only —
 * read access to published listings plus writes scoped to the caller's own
 * favorites/enquiries/profile rows, all enforced by RLS. There is no
 * service-role escalation path in this app.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component with no response to write to.
            // Session refresh happens in proxy.ts instead.
          }
        },
      },
    }
  );
}
