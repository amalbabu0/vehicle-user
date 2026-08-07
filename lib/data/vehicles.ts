import { createPublicClient } from "@/lib/supabase/public-client";
import { getLocationLookup, type LocationLookup } from "@/lib/data/locations";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

// Shared select for anything that renders a VehicleCard — published listings
// only (RLS also enforces this, this just avoids over-fetching columns).
export const VEHICLE_CARD_SELECT = `
  id, slug, name, model, registration_year, fuel_type, transmission, km_driven,
  lease_amount, lease_period, view_count, published_at, approved_by, location_id,
  brands ( name ),
  vehicle_images ( url, thumbnail_url, is_cover, sort_order )
`;

type VehicleCardRow = {
  id: string;
  slug: string;
  name: string;
  model: string | null;
  registration_year: number | null;
  fuel_type: string | null;
  transmission: string | null;
  km_driven: number | null;
  lease_amount: number;
  lease_period: string;
  view_count: number;
  published_at: string | null;
  approved_by: string | null;
  location_id: string | null;
  brands: { name: string } | null;
  vehicle_images: { url: string; thumbnail_url: string | null; is_cover: boolean; sort_order: number }[];
};

export function mapVehicleRowToCard(row: VehicleCardRow, locations: LocationLookup): VehicleCardData {
  const location = row.location_id ? locations.get(row.location_id) : undefined;
  const cover =
    row.vehicle_images.find((image) => image.is_cover) ??
    [...row.vehicle_images].sort((a, b) => a.sort_order - b.sort_order)[0];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brandName: row.brands?.name ?? null,
    model: row.model,
    registrationYear: row.registration_year,
    fuelType: row.fuel_type,
    transmission: row.transmission,
    kmDriven: row.km_driven,
    leaseAmount: row.lease_amount,
    leasePeriod: row.lease_period,
    districtName: location?.districtName ?? null,
    locationName: location?.name ?? null,
    coverImageUrl: cover?.url ?? null,
    coverThumbnailUrl: cover?.thumbnail_url ?? null,
    viewCount: row.view_count,
    publishedAt: row.published_at,
    verified: row.approved_by !== null,
  };
}

export async function getVehicleCardsByIds(ids: string[]): Promise<VehicleCardData[]> {
  if (ids.length === 0) return [];
  const supabase = createPublicClient();
  const [{ data }, locations] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_CARD_SELECT).eq("status", "published").in("id", ids),
    getLocationLookup(),
  ]);
  const rows = (data ?? []) as unknown as VehicleCardRow[];
  const byId = new Map(rows.map((row) => [row.id, row]));
  // Preserve caller-specified order (e.g. featured_listing_ids curation order).
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is VehicleCardRow => Boolean(row))
    .map((row) => mapVehicleRowToCard(row, locations));
}

export async function getLatestVehicles(limit: number, offset = 0): Promise<VehicleCardData[]> {
  const supabase = createPublicClient();
  const [{ data }, locations] = await Promise.all([
    supabase
      .from("vehicles")
      .select(VEHICLE_CARD_SELECT)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .range(offset, offset + limit - 1),
    getLocationLookup(),
  ]);
  const rows = (data ?? []) as unknown as VehicleCardRow[];
  return rows.map((row) => mapVehicleRowToCard(row, locations));
}

export type VehicleDetail = VehicleCardData & {
  description: string | null;
  contactPhone: string;
  directOwner: boolean;
  condition: string | null;
  engineCapacity: string | null;
  seats: number | null;
  color: string | null;
  features: string[];
  serviceChargePercent: number | null;
  images: { url: string; mediumUrl: string | null; thumbnailUrl: string | null }[];
  brandId: string | null;
  locationId: string | null;
};

const VEHICLE_DETAIL_SELECT = `
  id, slug, name, model, registration_year, fuel_type, transmission, km_driven,
  lease_amount, lease_period, view_count, published_at, approved_by, location_id, brand_id,
  description, contact_phone, direct_owner, condition, engine_capacity, seats, color,
  features, service_charge_percent,
  brands ( name ),
  vehicle_images ( url, medium_url, thumbnail_url, is_cover, sort_order )
`;

type VehicleDetailRow = Omit<VehicleCardRow, "vehicle_images"> & {
  brand_id: string | null;
  description: string | null;
  contact_phone: string;
  direct_owner: boolean;
  condition: string | null;
  engine_capacity: string | null;
  seats: number | null;
  color: string | null;
  features: string[];
  service_charge_percent: number | null;
  vehicle_images: { url: string; medium_url: string | null; thumbnail_url: string | null; is_cover: boolean; sort_order: number }[];
};

export async function getVehicleBySlug(slug: string): Promise<VehicleDetail | null> {
  const supabase = createPublicClient();
  const [{ data }, locations] = await Promise.all([
    supabase.from("vehicles").select(VEHICLE_DETAIL_SELECT).eq("status", "published").eq("slug", slug).maybeSingle(),
    getLocationLookup(),
  ]);
  if (!data) return null;

  const row = data as unknown as VehicleDetailRow;
  const card = mapVehicleRowToCard(row, locations);
  return {
    ...card,
    description: row.description,
    contactPhone: row.contact_phone,
    directOwner: row.direct_owner,
    condition: row.condition,
    engineCapacity: row.engine_capacity,
    seats: row.seats,
    color: row.color,
    features: row.features ?? [],
    serviceChargePercent: row.service_charge_percent,
    images: [...row.vehicle_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({ url: image.url, mediumUrl: image.medium_url, thumbnailUrl: image.thumbnail_url })),
    brandId: row.brand_id,
    locationId: row.location_id,
  };
}

/** Related-listings for the detail page's internal-linking section — same
 * brand first (closest match), topped up with same-district listings if
 * the brand alone doesn't fill `limit`. Excludes the current vehicle.
 * A real internal link between individual vehicle pages didn't exist
 * anywhere before this (see SEO.md audit) — without it, published
 * listings were only ever reachable via search/homepage, not from each
 * other, which is exactly what makes a page an SEO "orphan". */
export async function getRelatedVehicles(
  current: { id: string; brandId: string | null; locationId: string | null },
  limit = 8
): Promise<VehicleCardData[]> {
  const supabase = createPublicClient();
  const locations = await getLocationLookup();
  const seen = new Set([current.id]);
  const results: VehicleCardRow[] = [];

  if (current.brandId) {
    const { data } = await supabase
      .from("vehicles")
      .select(VEHICLE_CARD_SELECT)
      .eq("status", "published")
      .eq("brand_id", current.brandId)
      .neq("id", current.id)
      .order("published_at", { ascending: false })
      .limit(limit);
    for (const row of (data ?? []) as unknown as VehicleCardRow[]) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        results.push(row);
      }
    }
  }

  if (results.length < limit && current.locationId) {
    const { data } = await supabase
      .from("vehicles")
      .select(VEHICLE_CARD_SELECT)
      .eq("status", "published")
      .eq("location_id", current.locationId)
      .neq("id", current.id)
      .order("published_at", { ascending: false })
      .limit(limit - results.length + seen.size);
    for (const row of (data ?? []) as unknown as VehicleCardRow[]) {
      if (results.length >= limit) break;
      if (!seen.has(row.id)) {
        seen.add(row.id);
        results.push(row);
      }
    }
  }

  return results.slice(0, limit).map((row) => mapVehicleRowToCard(row, locations));
}

/** RLS blocks a plain UPDATE from a random visitor, so this goes through the
 * increment_vehicle_view SECURITY DEFINER function (published-only, atomic —
 * see admin/supabase/migrations/0012). Best-effort: errors are swallowed
 * rather than failing the page render. */
export async function incrementViewCount(vehicleId: string): Promise<void> {
  const supabase = createPublicClient();
  await supabase.rpc("increment_vehicle_view", { p_vehicle_id: vehicleId });
}

export async function getMostViewedVehicles(limit: number, excludeIds: string[] = []): Promise<VehicleCardData[]> {
  const supabase = createPublicClient();
  const query = supabase
    .from("vehicles")
    .select(VEHICLE_CARD_SELECT)
    .eq("status", "published")
    .order("view_count", { ascending: false })
    .limit(limit + excludeIds.length);

  const [{ data }, locations] = await Promise.all([query, getLocationLookup()]);
  const rows = ((data ?? []) as unknown as VehicleCardRow[]).filter((row) => !excludeIds.includes(row.id));
  return rows.slice(0, limit).map((row) => mapVehicleRowToCard(row, locations));
}
