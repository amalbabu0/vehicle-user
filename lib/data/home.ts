import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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

export type BrandWithCount = { id: string; name: string; slug: string; logoUrl: string | null; count: number };

/**
 * Popular brands to feature, split car vs. bike — curated by name since the
 * brands table holds every brand a lister has ever typed (see admin's
 * quick-listing auto-create), not just the well-known ones worth a homepage
 * tile. Counts are real (published listings only); a brand not seeded yet
 * (or with 0 listings) is simply omitted rather than shown with a fake 0.
 */
const POPULAR_CAR_BRANDS = [
  "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Toyota", "Honda", "Kia", "MG", "Volkswagen", "Skoda",
];
const POPULAR_BIKE_BRANDS = ["Hero", "Honda", "Yamaha", "Royal Enfield", "KTM", "TVS", "Bajaj", "Suzuki"];

async function getBrandsWithCounts(names: string[]): Promise<BrandWithCount[]> {
  const supabase = await createClient();
  // Same GROUP BY aggregation as getCategoriesWithCounts, not a full scan of
  // published vehicles' brand_id.
  const [{ data: brands }, { data: counts }] = await Promise.all([
    supabase.from("brands").select("id, name, slug, logo_url").in("name", names),
    supabase.rpc("get_brand_vehicle_counts"),
  ]);

  const countByBrand = new Map((counts ?? []).map((row) => [row.brand_id, row.vehicle_count]));

  const byName = new Map((brands ?? []).map((brand) => [brand.name, brand]));
  return names
    .map((name) => byName.get(name))
    .filter((brand): brand is NonNullable<typeof brand> => Boolean(brand))
    .map((brand) => ({
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logo_url,
      count: Number(countByBrand.get(brand.id) ?? 0),
    }));
}

export function getPopularCarBrands() {
  return getBrandsWithCounts(POPULAR_CAR_BRANDS);
}

export function getPopularBikeBrands() {
  return getBrandsWithCounts(POPULAR_BIKE_BRANDS);
}

export type PopularSearch = { label: string; brandName: string; model: string | null };

/**
 * Derived from real published listings (brand + model pairs), ranked by
 * combined view count. Empty on a fresh platform with few listings — the
 * component hides itself rather than showing fabricated "trending" terms.
 */
export async function getPopularSearches(limit = 8): Promise<PopularSearch[]> {
  const supabase = await createClient();
  // get_popular_searches does the group-by-model, sum(view_count), sort,
  // and LIMIT in Postgres — previously this fetched every published
  // vehicle's model + view_count and did all of that in JS, an unbounded
  // fetch that grew with the whole catalog just to return up to 8 rows.
  const { data } = await supabase.rpc("get_popular_searches", { p_limit: limit });

  return (data ?? [])
    .filter((row): row is { brand_name: string; model: string; total_views: number } => Boolean(row.model))
    .map((row) => ({ label: `Used ${row.model}`, brandName: row.brand_name, model: row.model }));
}

export type Testimonial = { name: string; location: string; quote: string; rating: number };

/**
 * Admin-editable via site_settings (key: homepage_testimonials, a JSON
 * array) — no seed data exists yet, so this returns [] until an admin adds
 * real customer testimonials. The component hides itself when empty rather
 * than showing placeholder quotes.
 */
export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("value").eq("key", "homepage_testimonials").maybeSingle();
  return Array.isArray(data?.value) ? (data.value as Testimonial[]) : [];
}
