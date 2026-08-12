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
}: {
  id?: string;
  title: string;
  subtitle?: string;
  vehicles: VehicleCardData[];
  viewAllHref?: string;
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

      <div className="mt-6 grid grid-cols-2 gap-3 px-4 sm:gap-5 sm:px-6 lg:grid-cols-4 lg:px-8">
        {vehicles.map((vehicle) => (
          // 2-up on phones/tablets, 4-up from lg — the card's default `sizes`
          // assumes a full-width 1-up card, which would over-fetch here.
          <VehicleCard key={vehicle.id} vehicle={vehicle} imageSizes="(max-width: 1024px) 50vw, 25vw" />
        ))}
      </div>
    </section>
  );
}
