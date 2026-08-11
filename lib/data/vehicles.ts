import { createPublicClient } from "@/lib/supabase/public-client";
import { getLocationLookup, type LocationLookup } from "@/lib/data/locations";
import { formatLeasePeriod } from "@/lib/utils";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

// Shared select for anything that renders a VehicleCard — published listings
// only (RLS also enforces this, this just avoids over-fetching columns).
export const VEHICLE_CARD_SELECT = `
  id, slug, name, model, registration_year, fuel_type, transmission, km_driven,
  lease_amount, lease_period, view_count, published_at, approved_by, location_id, booking_status,
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
  booking_status: "available" | "booked";
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
    leasePeriod: formatLeasePeriod(row.lease_period),
    districtName: location?.districtName ?? null,
    locationName: location?.name ?? null,
    coverImageUrl: cover?.url ?? null,
    coverThumbnailUrl: cover?.thumbnail_url ?? null,
    viewCount: row.view_count,
    publishedAt: row.published_at,
    verified: row.approved_by !== null,
    bookingStatus: row.booking_status,
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
  ownershipCount: number | null;
  images: { url: string; mediumUrl: string | null; thumbnailUrl: string | null }[];
  brandId: string | null;
  locationId: string | null;
  categoryId: string | null;
};

const OWNERSHIP_ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];

/** "1st Owner", "2nd Owner", etc. — falls back to "Nth" past the named
 * ordinals rather than guessing a suffix (5th+ owner is rare but possible
 * for an older vehicle). */
export function formatOwnership(count: number | null): string | null {
  if (!count || count < 1) return null;
  const label = OWNERSHIP_ORDINALS[count - 1] ?? `${count}th`;
  return `${label} Owner`;
}

const VEHICLE_DETAIL_SELECT = `
  id, slug, name, model, registration_year, fuel_type, transmission, km_driven,
  lease_amount, lease_period, view_count, published_at, approved_by, location_id, brand_id, category_id, booking_status,
  description, contact_phone, direct_owner, condition, engine_capacity, seats, color,
  features, service_charge_percent, ownership_count,
  brands ( name ),
  vehicle_images ( url, medium_url, thumbnail_url, is_cover, sort_order )
`;

type VehicleDetailRow = Omit<VehicleCardRow, "vehicle_images"> & {
  brand_id: string | null;
  category_id: string | null;
  description: string | null;
  contact_phone: string;
  direct_owner: boolean;
  condition: string | null;
  engine_capacity: string | null;
  seats: number | null;
  color: string | null;
  features: string[];
  service_charge_percent: number | null;
  ownership_count: number | null;
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
    ownershipCount: row.ownership_count,
    images: [...row.vehicle_images]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({ url: image.url, mediumUrl: image.medium_url, thumbnailUrl: image.thumbnail_url })),
    brandId: row.brand_id,
    locationId: row.location_id,
    categoryId: row.category_id,
  };
}

/** Related-listings for the detail page's internal-linking section —
 * same vehicle type (category) first since that's what "similar" actually
 * means to a lessee (a bike page shouldn't recommend a bus), then same
 * brand within that type, then topped up with same-district listings if
 * neither fills `limit`. Excludes the current vehicle.
 * A real internal link between individual vehicle pages didn't exist
 * anywhere before this (see SEO.md audit) — without it, published
 * listings were only ever reachable via search/homepage, not from each
 * other, which is exactly what makes a page an SEO "orphan". */
export async function getRelatedVehicles(
  current: { id: string; brandId: string | null; locationId: string | null; categoryId: string | null },
  limit = 8
): Promise<VehicleCardData[]> {
  const supabase = createPublicClient();
  const locations = await getLocationLookup();
  const seen = new Set([current.id]);
  const results: VehicleCardRow[] = [];

  const addRows = (rows: VehicleCardRow[]) => {
    for (const row of rows) {
      if (results.length >= limit) break;
      if (!seen.has(row.id)) {
        seen.add(row.id);
        results.push(row);
      }
    }
  };

  if (current.categoryId && current.brandId) {
    const { data } = await supabase
      .from("vehicles")
      .select(VEHICLE_CARD_SELECT)
      .eq("status", "published")
      .eq("category_id", current.categoryId)
      .eq("brand_id", current.brandId)
      .neq("id", current.id)
      .order("published_at", { ascending: false })
      .limit(limit);
    addRows((data ?? []) as unknown as VehicleCardRow[]);
  }

  if (results.length < limit && current.categoryId) {
    const { data } = await supabase
      .from("vehicles")
      .select(VEHICLE_CARD_SELECT)
      .eq("status", "published")
      .eq("category_id", current.categoryId)
      .neq("id", current.id)
      .order("published_at", { ascending: false })
      .limit(limit - results.length + seen.size);
    addRows((data ?? []) as unknown as VehicleCardRow[]);
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
    addRows((data ?? []) as unknown as VehicleCardRow[]);
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
