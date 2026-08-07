import { createClient } from "@/lib/supabase/server";

export type LocationLookup = Map<string, { name: string; districtName: string }>;

/**
 * Kerala locations are seeded as a 2-level tree (district -> taluk). This
 * loads the whole (small, ~90 row) table once and resolves each location to
 * its district name, whether the row itself is a district (no parent) or a
 * taluk (parent is the district).
 */
export async function getLocationLookup(): Promise<LocationLookup> {
  const supabase = await createClient();
  const { data } = await supabase.from("locations").select("id, name, parent_location_id");
  const rows = data ?? [];
  const byId = new Map(rows.map((row) => [row.id, row]));

  const lookup: LocationLookup = new Map();
  for (const row of rows) {
    const parent = row.parent_location_id ? byId.get(row.parent_location_id) : null;
    lookup.set(row.id, { name: row.name, districtName: parent ? parent.name : row.name });
  }
  return lookup;
}

export type DistrictOption = { id: string; name: string; slug: string };

/** Districts are the top-level location rows (no parent). */
export async function getDistricts(): Promise<DistrictOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("locations")
    .select("id, name, slug")
    .is("parent_location_id", null)
    .order("name");
  return data ?? [];
}
