import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public-client";

export type LocationLookup = Map<string, { name: string; districtName: string }>;

/**
 * Kerala locations are seeded as a 2-level tree (district -> taluk). This
 * loads the whole (small, ~90 row) table once and resolves each location to
 * its district name, whether the row itself is a district (no parent) or a
 * taluk (parent is the district).
 *
 * Wrapped in React's `cache()` — a vehicle detail page calls this once via
 * getVehicleBySlug and again via getRelatedVehicles, and a search page can
 * call it once per result page; `cache()` dedupes those into a single DB
 * round trip per request instead of one per call, with no staleness risk
 * (it only memoizes within one render, never across requests).
 */
export const getLocationLookup = cache(async (): Promise<LocationLookup> => {
  const supabase = createPublicClient();
  const { data } = await supabase.from("locations").select("id, name, parent_location_id");
  const rows = data ?? [];
  const byId = new Map(rows.map((row) => [row.id, row]));

  const lookup: LocationLookup = new Map();
  for (const row of rows) {
    const parent = row.parent_location_id ? byId.get(row.parent_location_id) : null;
    lookup.set(row.id, { name: row.name, districtName: parent ? parent.name : row.name });
  }
  return lookup;
});

export type DistrictOption = { id: string; name: string; slug: string };

/** Districts are the top-level location rows (no parent). */
export const getDistricts = cache(async (): Promise<DistrictOption[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("locations")
    .select("id, name, slug")
    .is("parent_location_id", null)
    .order("name");
  return data ?? [];
});
