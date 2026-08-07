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
  const [{ data: categories }, { data: vehicles }] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("vehicles").select("category_id").eq("status", "published"),
  ]);

  const counts = new Map<string, number>();
  for (const vehicle of vehicles ?? []) {
    if (!vehicle.category_id) continue;
    counts.set(vehicle.category_id, (counts.get(vehicle.category_id) ?? 0) + 1);
  }

  return (categories ?? []).map((category) => ({
    ...category,
    count: counts.get(category.id) ?? 0,
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
  const [{ data: brands }, { data: vehicles }] = await Promise.all([
    supabase.from("brands").select("id, name, slug, logo_url").in("name", names),
    supabase.from("vehicles").select("brand_id").eq("status", "published"),
  ]);

  const counts = new Map<string, number>();
  for (const vehicle of vehicles ?? []) {
    if (!vehicle.brand_id) continue;
    counts.set(vehicle.brand_id, (counts.get(vehicle.brand_id) ?? 0) + 1);
  }

  const byName = new Map((brands ?? []).map((brand) => [brand.name, brand]));
  return names
    .map((name) => byName.get(name))
    .filter((brand): brand is NonNullable<typeof brand> => Boolean(brand))
    .map((brand) => ({ id: brand.id, name: brand.name, slug: brand.slug, logoUrl: brand.logo_url, count: counts.get(brand.id) ?? 0 }));
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
  const { data } = await supabase
    .from("vehicles")
    .select("model, view_count, brands ( name )")
    .eq("status", "published")
    .not("model", "is", null);

  const rows = (data ?? []) as unknown as { model: string | null; view_count: number; brands: { name: string } | null }[];
  const grouped = new Map<string, { brandName: string; model: string; views: number }>();
  for (const row of rows) {
    if (!row.model || !row.brands?.name) continue;
    const key = `${row.brands.name}|${row.model}`;
    const existing = grouped.get(key);
    if (existing) existing.views += row.view_count;
    else grouped.set(key, { brandName: row.brands.name, model: row.model, views: row.view_count });
  }

  return [...grouped.values()]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
    .map((entry) => ({ label: `Used ${entry.model}`, brandName: entry.brandName, model: entry.model }));
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
