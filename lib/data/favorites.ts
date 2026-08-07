import { createClient } from "@/lib/supabase/server";

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
