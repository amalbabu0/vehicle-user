import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCardSkeleton } from "@/components/vehicle-card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// Mirrors the signed-in branch of app/favorites/page.tsx: heading + count
// line, then InfiniteVehicleGrid's default "column" layout (single-column
// cards — see components/infinite-vehicle-grid.tsx's `view = "column"`
// default). The signed-out branch renders instantly (no data fetch), so it
// doesn't need a skeleton of its own.
export default function FavoritesLoading() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-32" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <VehicleCardSkeleton key={i} view="grid" />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
