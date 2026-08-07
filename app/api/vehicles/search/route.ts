import { NextResponse } from "next/server";
import { searchVehicles, parseFiltersFromSearchParams } from "@/lib/data/search";
import { getFavoriteVehicleIds } from "@/lib/data/favorites";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const cursor = params.cursor || null;

  const filters = parseFiltersFromSearchParams(params);
  const [{ vehicles, nextCursor }, favoriteIds] = await Promise.all([
    searchVehicles(filters, PAGE_SIZE, cursor),
    getFavoriteVehicleIds(),
  ]);

  return NextResponse.json({
    vehicles: vehicles.map((vehicle) => ({ ...vehicle, favorited: favoriteIds.has(vehicle.id) })),
    nextCursor,
  });
}
