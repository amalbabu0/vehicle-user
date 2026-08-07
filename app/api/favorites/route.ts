import { NextResponse } from "next/server";
import * as z from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ vehicleId: z.uuid() });

/** Toggles a favorite for the signed-in user. RLS (favorites_all_own) is the
 * real boundary — this only ever touches rows scoped to auth.uid(). */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const validation = schema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ message: "Invalid vehicle id." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in to save favorites." }, { status: 401 });
  }

  const { vehicleId } = validation.data;
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("favorites").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ message: error.message }, { status: 500 });
    return NextResponse.json({ favorited: false });
  }

  const { error } = await supabase.from("favorites").insert({ user_id: user.id, vehicle_id: vehicleId });
  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json({ favorited: true });
}
