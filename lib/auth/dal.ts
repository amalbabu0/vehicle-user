import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Data Access Layer — the real authorization boundary, alongside RLS.
 * cache() memoizes per request so calling this from multiple Server
 * Components in one render doesn't re-hit Supabase each time. Never rely
 * on proxy.ts or client-side checks alone — see proxy.ts's own comment.
 *
 * Most of this site is public (browse/search/vehicle details) — this is
 * only called from the handful of routes that require a signed-in user
 * (favorites, enquiries, profile, settings).
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

export const getCurrentProfile = cache(async (): Promise<Profile> => {
  const user = await verifySession();
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
  }

  return profile;
});
