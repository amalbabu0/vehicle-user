"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Car } from "lucide-react";
import { VehicleCard, VehicleCardSkeleton } from "@/components/vehicle-card";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

type VehicleWithFavorite = VehicleCardData & { favorited: boolean };

export function InfiniteVehicleGrid({
  initialVehicles,
  initialHasMore,
  filtersQueryString,
}: {
  initialVehicles: VehicleWithFavorite[];
  initialHasMore: boolean;
  filtersQueryString: string;
}) {
  // The parent remounts this component (key={filtersQueryString}) whenever
  // filters change, so this state only ever needs to seed once from props —
  // no effect needed to re-sync it.
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const params = new URLSearchParams(filtersQueryString);
      params.set("offset", String(vehicles.length));
      const response = await fetch(`/api/vehicles/search?${params.toString()}`);
      if (!response.ok) return;
      const payload = await response.json();
      setVehicles((prev) => [...prev, ...payload.vehicles]);
      setHasMore(payload.hasMore);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [filtersQueryString, hasMore, vehicles.length]);

  useEffect(() => {
    if (!hasMore) return;
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
  }, [hasMore, loadMore]);

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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} favorited={vehicle.favorited} />
        ))}
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <VehicleCardSkeleton key={`skeleton-${i}`} />) : null}
      </div>
      {hasMore ? <div ref={sentinelRef} className="h-1 w-full" /> : null}
    </div>
  );
}
