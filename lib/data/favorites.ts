import { createClient } from "@/lib/supabase/server";
import { getLocationLookup } from "@/lib/data/locations";
import { VEHICLE_CARD_SELECT, mapVehicleRowToCard } from "@/lib/data/vehicles";
import { encodeCursor, decodeCursor } from "@/lib/utils/cursor";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

/** Empty set for signed-out visitors — no favorites to show as active. */
export async function getFavoriteVehicleIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase.from("favorites").select("vehicle_id").eq("user_id", user.id);
  return new Set((data ?? []).map((row) => row.vehicle_id));
}

type FavoriteRow = {
  id: string;
  created_at: string;
  vehicles: Parameters<typeof mapVehicleRowToCard>[0] | null;
};

/** Cursor-paginated (see PERFORMANCE.md #4) — a favorites list has no
 * natural cap and this keeps it fast at any depth, same as the main
 * search results. */
export async function getFavoritesCursorPage(
  userId: string,
  limit: number,
  cursor: string | null
): Promise<{ vehicles: VehicleCardData[]; nextCursor: string | null; total: number }> {
  const supabase = await createClient();
  let query = supabase
    .from("favorites")
    .select(`id, created_at, vehicles ( ${VEHICLE_CARD_SELECT} )`, { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  const decoded = decodeCursor(cursor);
  if (decoded) {
    query = query.or(`created_at.lt.${decoded.v},and(created_at.eq.${decoded.v},id.lt.${decoded.id})`);
  }
  query = query.limit(limit + 1);

  const [{ data, count }, locations] = await Promise.all([query, getLocationLookup()]);
  const rows = (data ?? []) as unknown as FavoriteRow[];

  const hasMore = rows.length > limit;
  const pageRows = hasMore ? rows.slice(0, limit) : rows;
  // A favorited vehicle can later be unpublished/archived/deleted — RLS
  // then hides it from the embedded select (comes back null) rather than
  // erroring. Drop those rather than rendering a blank card.
  const visibleRows = pageRows.filter((row): row is FavoriteRow & { vehicles: NonNullable<FavoriteRow["vehicles"]> } => row.vehicles !== null);

  const vehicles = visibleRows.map((row) => mapVehicleRowToCard(row.vehicles, locations));

  const lastRow = pageRows[pageRows.length - 1];
  const nextCursor = hasMore && lastRow ? encodeCursor({ v: lastRow.created_at, id: lastRow.id }) : null;

  return { vehicles, nextCursor, total: count ?? 0 };
}
