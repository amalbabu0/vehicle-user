import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFavoritesCursorPage } from "@/lib/data/favorites";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Sign in to see your favorites." }, { status: 401 });
  }

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  const { vehicles, nextCursor } = await getFavoritesCursorPage(user.id, PAGE_SIZE, cursor);

  return NextResponse.json({
    vehicles: vehicles.map((vehicle) => ({ ...vehicle, favorited: true })),
    nextCursor,
  });
}
