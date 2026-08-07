import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public-client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("slug, updated_at")
    .eq("status", "published");

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: env.SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${env.SITE_URL}/vehicles`, changeFrequency: "hourly", priority: 0.9 },
  ];

  const vehicleRoutes: MetadataRoute.Sitemap = (vehicles ?? []).map((vehicle) => ({
    url: `${env.SITE_URL}/vehicles/${vehicle.slug}`,
    lastModified: vehicle.updated_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...vehicleRoutes];
}
