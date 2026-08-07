import { createPublicClient } from "@/lib/supabase/public-client";
import { getLocationLookup } from "@/lib/data/locations";
import { VEHICLE_CARD_SELECT, mapVehicleRowToCard } from "@/lib/data/vehicles";
import { encodeCursor, decodeCursor } from "@/lib/utils/cursor";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

type SortOption = "latest" | "price_asc" | "price_desc" | "popular";

const SORT_CONFIG: Record<SortOption, { column: "published_at" | "lease_amount" | "view_count"; ascending: boolean }> = {
  latest: { column: "published_at", ascending: false },
  price_asc: { column: "lease_amount", ascending: true },
  price_desc: { column: "lease_amount", ascending: false },
  popular: { column: "view_count", ascending: false },
};

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

async function resolveBrandId(supabase: ReturnType<typeof createPublicClient>, slug: string) {
  const { data } = await supabase.from("brands").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

async function resolveCategoryId(supabase: ReturnType<typeof createPublicClient>, slug: string) {
  const { data } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

/** A "district" filter should match the district row itself plus every
 * taluk under it — vehicles.location_id can point to either level. */
async function resolveDistrictLocationIds(supabase: ReturnType<typeof createPublicClient>, slug: string) {
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

// Supabase's fluent query builder's type changes shape with every chained
// .eq()/.or()/etc call in a way that doesn't genericize cleanly across two
// different call sites building different queries — this function's
// query param/return are deliberately typed as the Supabase builder's own
// broad PostgrestFilterBuilder type (not `any`: still catches typos in
// method/column names), with each call site re-narrowing via its own
// `.select(...)` before this runs.
type FilterableVehiclesQuery = ReturnType<ReturnType<ReturnType<typeof createPublicClient>["from"]>["select"]>;

/** Shared by both retrieval strategies below — every filter, applied the
 * same way regardless of whether the caller then does cursor or offset
 * pagination on top. */
async function applyFilters(
  query: FilterableVehiclesQuery,
  filters: VehicleFilters,
  supabase: ReturnType<typeof createPublicClient>
): Promise<FilterableVehiclesQuery> {
  let q = query;
  if (filters.q?.trim()) {
    const safe = filters.q.replace(/[,()%]/g, " ").trim();
    if (safe) q = q.or(`name.ilike.%${safe}%,model.ilike.%${safe}%`);
  }
  if (filters.brand) {
    const id = await resolveBrandId(supabase, filters.brand);
    q = q.eq("brand_id", id ?? NO_MATCH_ID);
  }
  if (filters.category) {
    const id = await resolveCategoryId(supabase, filters.category);
    q = q.eq("category_id", id ?? NO_MATCH_ID);
  }
  if (filters.district) {
    const ids = await resolveDistrictLocationIds(supabase, filters.district);
    q = ids.length ? q.in("location_id", ids) : q.eq("id", NO_MATCH_ID);
  }
  if (filters.fuelType) q = q.eq("fuel_type", filters.fuelType);
  if (filters.transmission) q = q.eq("transmission", filters.transmission);
  if (filters.minPrice != null) q = q.gte("lease_amount", filters.minPrice);
  if (filters.maxPrice != null) q = q.lte("lease_amount", filters.maxPrice);
  if (filters.year != null) q = q.eq("registration_year", filters.year);
  if (filters.ownerType) q = q.eq("direct_owner", filters.ownerType === "direct");
  if (filters.condition) q = q.ilike("condition", `%${filters.condition.replace(/[,()%]/g, " ").trim()}%`);
  return q;
}

export async function searchVehicles(
  filters: VehicleFilters,
  limit: number,
  cursor: string | null
): Promise<{ vehicles: VehicleCardData[]; nextCursor: string | null; total: number }> {
  const supabase = createPublicClient();
  let query = await applyFilters(supabase.from("vehicles").select(VEHICLE_CARD_SELECT, { count: "exact" }).eq("status", "published"), filters, supabase);

  const sortOption = filters.sort ?? "latest";
  const { column, ascending } = SORT_CONFIG[sortOption];
  // id as a secondary sort key + cursor tiebreaker: published_at/lease_amount/
  // view_count can repeat across rows, and without a unique tiebreaker a
  // cursor built from a duplicated value could skip or repeat rows.
  query = query.order(column, { ascending }).order("id", { ascending });

  const decoded = decodeCursor(cursor);
  if (decoded) {
    const op = ascending ? "gt" : "lt";
    query = query.or(`${column}.${op}.${decoded.v},and(${column}.eq.${decoded.v},id.${op}.${decoded.id})`);
  }

  // Fetch one extra row to know whether there's a next page without a
  // separate COUNT-vs-offset comparison.
  query = query.limit(limit + 1);

  const [{ data, count }, locations] = await Promise.all([query, getLocationLookup()]);
  const rows = (data ?? []) as unknown as (Parameters<typeof mapVehicleRowToCard>[0] & {
    published_at: string | null;
    lease_amount: number;
    view_count: number;
  })[];

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  const vehicles = pageRows.map((row) => mapVehicleRowToCard(row, locations));

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastRow ? encodeCursor({ v: String(lastRow[column]), id: lastRow.id }) : null;

  return { vehicles, nextCursor, total: count ?? 0 };
}

/** Offset-based (page-number) retrieval — deliberately separate from the
 * cursor/keyset function above, not a variant of it. Cursor pagination has
 * no way to jump to an arbitrary page without walking every cursor before
 * it, which is exactly what a crawler following a `?page=N` link needs to
 * do. The default browsing experience (infinite scroll) keeps using
 * searchVehicles/cursor above unchanged; this path only activates when a
 * `page` query param is present in the URL — see app/vehicles/page.tsx. */
export async function searchVehiclesByPage(
  filters: VehicleFilters,
  page: number,
  pageSize: number
): Promise<{ vehicles: VehicleCardData[]; total: number; totalPages: number }> {
  const supabase = createPublicClient();
  let query = await applyFilters(supabase.from("vehicles").select(VEHICLE_CARD_SELECT, { count: "exact" }).eq("status", "published"), filters, supabase);

  const sortOption = filters.sort ?? "latest";
  const { column, ascending } = SORT_CONFIG[sortOption];
  query = query.order(column, { ascending }).order("id", { ascending });

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const [{ data, count }, locations] = await Promise.all([query, getLocationLookup()]);
  const rows = (data ?? []) as unknown as Parameters<typeof mapVehicleRowToCard>[0][];
  const vehicles = rows.map((row) => mapVehicleRowToCard(row, locations));
  const total = count ?? 0;

  return { vehicles, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export type FilterableBrand = { id: string; name: string; slug: string };

/** Every brand with at least one published listing — used to populate the
 * filter sidebar's brand dropdown (broader than the curated homepage list). */
export async function getFilterableBrands(): Promise<FilterableBrand[]> {
  const supabase = createPublicClient();
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
