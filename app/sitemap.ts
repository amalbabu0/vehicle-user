import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public-client";

// Fully dynamic, not cached: a newly published listing must appear here
// the moment a crawler asks, not after waiting out a stale cache window
// (previously 30 minutes) or depending on the admin app calling back to
// bust that cache — this route now just always queries fresh. Cheap to do
// since it's one indexed, published-only select and this route is only
// ever hit by crawlers, not real user traffic.
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("slug, updated_at")
    .eq("status", "published");

  // lastModified was previously omitted on every static route — Google's
  // own sitemap docs list it as a signal for re-crawl scheduling, and its
  // absence here was confirmed live (curl the deployed /sitemap.xml: only
  // the vehicle routes below had a lastmod). `now` is honest for these: this
  // route renders fresh on every request (see `revalidate` above), so "this
  // URL was live and current as of this timestamp" is accurate, not a
  // fabricated freshness signal.
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: env.SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${env.SITE_URL}/vehicles`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${env.SITE_URL}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${env.SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${env.SITE_URL}/sell`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${env.SITE_URL}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${env.SITE_URL}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const vehicleRoutes: MetadataRoute.Sitemap = (vehicles ?? []).map((vehicle) => ({
    url: `${env.SITE_URL}/vehicles/${vehicle.slug}`,
    lastModified: vehicle.updated_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...vehicleRoutes];
}
