import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCardSkeleton } from "@/components/vehicle-card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// This is the site's highest-traffic cold-entry page (search/ads land
// here) and previously had no loading.tsx at all — a hard refresh or deep
// link showed a blank white screen (no Navbar/Footer even) until
// searchVehicles() + the filter-option queries all resolved. Mirrors
// app/vehicles/page.tsx: Navbar/Footer chrome, heading+count line, the
// mobile filter-sheet trigger, a sticky lg:block filters aside, and
// VehicleResults' default "column" view (single-column cards — see
// components/vehicle-results.tsx).
export default function VehiclesLoading() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 sm:h-9" />
            <Skeleton className="mt-2 h-4 w-32" />
          </div>
        </div>

        <div className="mt-4 lg:hidden">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>

        <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-[280px_1fr]">
          <div className="hidden rounded-(--glass-radius-lg) border border-border p-4 lg:block">
            <Skeleton className="h-4 w-16" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-end">
              <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <VehicleCardSkeleton key={i} view="grid" />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
