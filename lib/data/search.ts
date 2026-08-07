import { createClient } from "@/lib/supabase/server";
import { getLocationLookup } from "@/lib/data/locations";
import { VEHICLE_CARD_SELECT, mapVehicleRowToCard } from "@/lib/data/vehicles";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

export type VehicleFilters = {
  q?: string;
  brand?: string;
  category?: string;
  district?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  year?: number;
  ownerType?: "direct" | "agent";
  condition?: string;
  sort?: "latest" | "price_asc" | "price_desc" | "popular";
};

const NO_MATCH_ID = "00000000-0000-0000-0000-000000000000";

async function resolveBrandId(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data } = await supabase.from("brands").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

async function resolveCategoryId(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

/** A "district" filter should match the district row itself plus every
 * taluk under it — vehicles.location_id can point to either level. */
async function resolveDistrictLocationIds(supabase: Awaited<ReturnType<typeof createClient>>, slug: string) {
  const { data: district } = await supabase
    .from("locations")
    .select("id")
    .eq("slug", slug)
    .is("parent_location_id", null)
    .maybeSingle();
  if (!district) return [];

  const { data: taluks } = await supabase.from("locations").select("id").eq("parent_location_id", district.id);
  return [district.id, ...(taluks ?? []).map((t) => t.id)];
}

export async function searchVehicles(
  filters: VehicleFilters,
  limit: number,
  offset: number
): Promise<{ vehicles: VehicleCardData[]; hasMore: boolean; total: number }> {
  const supabase = await createClient();
  let query = supabase.from("vehicles").select(VEHICLE_CARD_SELECT, { count: "exact" }).eq("status", "published");

  if (filters.q?.trim()) {
    const safe = filters.q.replace(/[,()%]/g, " ").trim();
    if (safe) query = query.or(`name.ilike.%${safe}%,model.ilike.%${safe}%`);
  }
  if (filters.brand) {
    const id = await resolveBrandId(supabase, filters.brand);
    query = query.eq("brand_id", id ?? NO_MATCH_ID);
  }
  if (filters.category) {
    const id = await resolveCategoryId(supabase, filters.category);
    query = query.eq("category_id", id ?? NO_MATCH_ID);
  }
  if (filters.district) {
    const ids = await resolveDistrictLocationIds(supabase, filters.district);
    query = ids.length ? query.in("location_id", ids) : query.eq("id", NO_MATCH_ID);
  }
  if (filters.fuelType) query = query.eq("fuel_type", filters.fuelType);
  if (filters.transmission) query = query.eq("transmission", filters.transmission);
  if (filters.minPrice != null) query = query.gte("lease_amount", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("lease_amount", filters.maxPrice);
  if (filters.year != null) query = query.eq("registration_year", filters.year);
  if (filters.ownerType) query = query.eq("direct_owner", filters.ownerType === "direct");
  if (filters.condition) query = query.ilike("condition", `%${filters.condition.replace(/[,()%]/g, " ").trim()}%`);

  if (filters.sort === "price_asc") query = query.order("lease_amount", { ascending: true });
  else if (filters.sort === "price_desc") query = query.order("lease_amount", { ascending: false });
  else if (filters.sort === "popular") query = query.order("view_count", { ascending: false });
  else query = query.order("published_at", { ascending: false });

  query = query.range(offset, offset + limit - 1);

  const [{ data, count }, locations] = await Promise.all([query, getLocationLookup()]);
  const rows = (data ?? []) as unknown as Parameters<typeof mapVehicleRowToCard>[0][];
  const vehicles = rows.map((row) => mapVehicleRowToCard(row, locations));
  const total = count ?? 0;

  return { vehicles, hasMore: offset + vehicles.length < total, total };
}

export type FilterableBrand = { id: string; name: string; slug: string };

/** Every brand with at least one published listing — used to populate the
 * filter sidebar's brand dropdown (broader than the curated homepage list). */
export async function getFilterableBrands(): Promise<FilterableBrand[]> {
  const supabase = await createClient();
  // Which brands have >=1 published listing comes from a Postgres GROUP BY
  // (get_brand_vehicle_counts), not by fetching every published vehicle's
  // brand_id — see lib/data/home.ts for the same pattern.
  const [{ data: brands }, { data: counts }] = await Promise.all([
    supabase.from("brands").select("id, name, slug").order("name"),
    supabase.rpc("get_brand_vehicle_counts"),
  ]);

  const activeIds = new Set((counts ?? []).map((row) => row.brand_id));
  return (brands ?? []).filter((brand) => activeIds.has(brand.id));
}

export function parseFiltersFromSearchParams(searchParams: Record<string, string | string[] | undefined>): VehicleFilters {
  const get = (key: string) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const minPrice = get("minPrice");
  const maxPrice = get("maxPrice");
  const year = get("year");
  const ownerType = get("ownerType");
  const sort = get("sort");

  return {
    q: get("q") || undefined,
    brand: get("brand") || undefined,
    category: get("category") || undefined,
    district: get("district") || undefined,
    fuelType: get("fuelType") || undefined,
    transmission: get("transmission") || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    year: year ? Number(year) : undefined,
    ownerType: ownerType === "direct" || ownerType === "agent" ? ownerType : undefined,
    condition: get("condition") || undefined,
    sort: sort === "price_asc" || sort === "price_desc" || sort === "popular" || sort === "latest" ? sort : undefined,
  };
}
