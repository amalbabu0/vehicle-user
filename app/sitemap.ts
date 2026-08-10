import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public-client";

// Fallback safety net — the admin app's revalidation webhook
// (app/api/revalidate/route.ts) busts this on-demand on every listing
// status change, so this interval only matters if that call is ever
// missed (network blip, etc).
export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("slug, updated_at")
    .eq("status", "published");

  // lastModified was previously omitted on every static route — Google's
  // own sitemap docs list it as a signal for re-crawl scheduling, and its
  // absence here was confirmed live (curl the deployed /sitemap.xml: only
  // the vehicle routes below had a lastmod). `now` is honest for these: the
  // route re-renders on every revalidation window (see `revalidate` above),
  // so "this URL was live and current as of this timestamp" is accurate,
  // not a fabricated freshness signal.
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
