import { createPublicClient } from "@/lib/supabase/public-client";
import { getVehicleCardsByIds, getMostViewedVehicles } from "@/lib/data/vehicles";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

/**
 * Featured vehicles come from the admin-curated site_settings.featured_listing_ids
 * (see admin app's site_settings defaults). If the admin hasn't curated any
 * yet, or curated fewer than `limit`, top up with the most-viewed published
 * listings so the section is never empty just because nobody's picked
 * favorites yet.
 */
export async function getFeaturedVehicles(limit = 8): Promise<VehicleCardData[]> {
  const supabase = createPublicClient();
  const { data: setting } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "featured_listing_ids")
    .maybeSingle();

  const curatedIds = Array.isArray(setting?.value) ? (setting.value as string[]).slice(0, limit) : [];
  const curated = await getVehicleCardsByIds(curatedIds);

  if (curated.length >= limit) return curated;

  const fallback = await getMostViewedVehicles(limit - curated.length, curated.map((v) => v.id));
  return [...curated, ...fallback];
}

export type CategoryWithCount = { id: string; name: string; slug: string; count: number };

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = createPublicClient();
  // Counts come from a Postgres GROUP BY (get_category_vehicle_counts), not
  // by fetching every published vehicle row and counting in JS — that
  // doesn't scale as the vehicles table grows, and the Supabase JS client
  // has no GROUP BY of its own.
  const [{ data: categories }, { data: counts }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.rpc("get_category_vehicle_counts"),
  ]);

  const countByCategory = new Map((counts ?? []).map((row) => [row.category_id, row.vehicle_count]));

  return (categories ?? []).map((category) => ({
    ...category,
    count: Number(countByCategory.get(category.id) ?? 0),
  }));
}

export type Testimonial = { name: string; location: string; quote: string; rating: number };

/**
 * Admin-editable via site_settings (key: homepage_testimonials, a JSON
 * array) — no seed data exists yet, so this returns [] until an admin adds
 * real customer testimonials. The component hides itself when empty rather
 * than showing placeholder quotes.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "homepage_testimonials").maybeSingle();
  return Array.isArray(data?.value) ? (data.value as Testimonial[]) : [];
}
