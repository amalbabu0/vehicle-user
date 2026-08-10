import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VehicleCard } from "@/components/vehicle-card";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

export function VehicleGridSection({
  id,
  title,
  subtitle,
  vehicles,
  viewAllHref,
  layout = "grid",
}: {
  id?: string;
  title: string;
  subtitle?: string;
  vehicles: VehicleCardData[];
  viewAllHref?: string;
  /** "scroll" renders a horizontally snap-scrolling row (mobile-friendly for
   * a short, hand-picked set like Featured, and lets cards peek off the
   * viewport edge); "grid" is the default browse layout used everywhere
   * else. Only the scroll row's own padding differs from the section's —
   * everything else keeps the site-wide px-4 sm:px-6 lg:px-8 rhythm. */
  layout?: "grid" | "scroll";
}) {
  if (vehicles.length === 0) return null;

  return (
    <section id={id} className="mx-auto max-w-7xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {viewAllHref ? (
          <Link href={viewAllHref} className="no-underline">
            <Button variant="outline">View all</Button>
          </Link>
        ) : null}
      </div>

      {layout === "scroll" ? (
        <div className="scrollbar-hide mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:gap-5 sm:px-6 lg:px-8">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="w-64 shrink-0 snap-start sm:w-72">
              <VehicleCard vehicle={vehicle} />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 px-4 sm:gap-5 sm:px-6 lg:grid-cols-4 lg:px-8">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}
    </section>
  );
}
