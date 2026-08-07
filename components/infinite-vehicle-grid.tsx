"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Car } from "lucide-react";
import { VehicleCard, VehicleCardSkeleton } from "@/components/vehicle-card";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

// undefined = unknown, resolved client-side via FavoritesProvider context
// rather than an explicit false, which would incorrectly skip that lookup
// (see components/favorite-button.tsx).
type VehicleWithFavorite = VehicleCardData & { favorited?: boolean };

export function InfiniteVehicleGrid({
  initialVehicles,
  initialCursor,
  filtersQueryString,
  fetchUrl = "/api/vehicles/search",
}: {
  initialVehicles: VehicleWithFavorite[];
  initialCursor: string | null;
  filtersQueryString: string;
  fetchUrl?: string;
}) {
  // The parent remounts this component (key={filtersQueryString}) whenever
  // filters change, so this state only ever needs to seed once from props —
  // no effect needed to re-sync it.
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !cursor) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const params = new URLSearchParams(filtersQueryString);
      params.set("cursor", cursor);
      const response = await fetch(`${fetchUrl}?${params.toString()}`);
      if (!response.ok) return;
      const payload = await response.json();
      setVehicles((prev) => [...prev, ...payload.vehicles]);
      setCursor(payload.nextCursor);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [filtersQueryString, cursor, fetchUrl]);

  useEffect(() => {
    if (!cursor) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  if (vehicles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-(--glass-radius-lg) border border-dashed border-border py-20 text-center">
        <Car className="size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No vehicles match your filters. Try widening your search.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} favorited={vehicle.favorited} />
        ))}
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <VehicleCardSkeleton key={`skeleton-${i}`} />) : null}
      </div>
      {cursor ? <div ref={sentinelRef} className="h-1 w-full" /> : null}
    </div>
  );
}
