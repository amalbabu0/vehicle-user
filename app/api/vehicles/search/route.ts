import { NextResponse } from "next/server";
import { searchVehicles, parseFiltersFromSearchParams } from "@/lib/data/search";
import { getFavoriteVehicleIds } from "@/lib/data/favorites";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const offset = Number(params.offset ?? 0) || 0;

  const filters = parseFiltersFromSearchParams(params);
  const [{ vehicles, hasMore }, favoriteIds] = await Promise.all([
    searchVehicles(filters, PAGE_SIZE, offset),
    getFavoriteVehicleIds(),
  ]);

  return NextResponse.json({
    vehicles: vehicles.map((vehicle) => ({ ...vehicle, favorited: favoriteIds.has(vehicle.id) })),
    hasMore,
  });
}
