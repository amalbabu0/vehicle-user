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

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: env.SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${env.SITE_URL}/vehicles`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${env.SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${env.SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${env.SITE_URL}/sell`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${env.SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${env.SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const vehicleRoutes: MetadataRoute.Sitemap = (vehicles ?? []).map((vehicle) => ({
    url: `${env.SITE_URL}/vehicles/${vehicle.slug}`,
    lastModified: vehicle.updated_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...vehicleRoutes];
}
