import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Client-side counterpart to lib/data/favorites.ts's getFavoriteVehicleIds —
 * pages no longer fetch this server-side (would force dynamic rendering,
 * see PERFORMANCE.md), so FavoritesProvider calls this on mount instead.
 * Returns an empty list rather than 401 for signed-out visitors, since this
 * is a progressive-enhancement fetch, not a hard requirement. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ids: [] });

  const { data } = await supabase.from("favorites").select("vehicle_id").eq("user_id", user.id);
  return NextResponse.json({ ids: (data ?? []).map((row) => row.vehicle_id) });
}
