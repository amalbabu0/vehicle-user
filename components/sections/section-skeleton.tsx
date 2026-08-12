import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCardSkeleton } from "@/components/vehicle-card";

/** Mirrors VehicleGridSection's exact structure: the title+subtitle+"View
 * all" button header row, and up to 8 cards (LatestVehicles fetches
 * getLatestVehicles(8) — this used to render only 4, one row short of the
 * real 2-row grid, causing a height jump when the real content mounted). */
export function VehicleSectionSkeleton() {
  return (
    <section className="mx-auto max-w-7xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <Skeleton className="h-8 w-56 sm:h-9" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 px-4 sm:gap-5 sm:px-6 lg:grid-cols-4 lg:px-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <VehicleCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
