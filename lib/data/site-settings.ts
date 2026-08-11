import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public-client";

// Both rows are the same ones the admin app's Settings -> Social tab and
// Contact page editor write to (lib/admin/settings-data.ts) — read-only
// here. cache() dedupes repeat calls within one request: the footer and
// SiteJsonLd (root layout) both need this on every page.
export type ContactInfo = { email?: string; phone?: string; whatsapp?: string };
export type SocialLinks = { facebook?: string; instagram?: string };

export const getContactInfo = cache(async (): Promise<ContactInfo> => {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "contact_info").maybeSingle();
  return (data?.value as ContactInfo) ?? {};
});

export const getSocialLinks = cache(async (): Promise<SocialLinks> => {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "social_links").maybeSingle();
  return (data?.value as SocialLinks) ?? {};
});
