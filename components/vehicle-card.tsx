import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BadgeCheck, Car } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

export function VehicleCard({
  vehicle,
  favorited,
}: {
  vehicle: VehicleCardData;
  /** Only pass this when known for certain server-side (e.g. /favorites).
   * Otherwise omit it and FavoriteButton resolves it from client-side
   * context — see components/favorite-button.tsx. */
  favorited?: boolean;
}) {
  return (
    <div className="glass-surface glass-specular group relative overflow-hidden rounded-(--glass-radius-lg) transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute right-3 top-3 z-10">
        <FavoriteButton vehicleId={vehicle.id} initialFavorited={favorited} />
      </div>

      <Link href={`/vehicles/${vehicle.slug}`} className="block text-foreground no-underline">
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
          {vehicle.coverImageUrl ? (
            <Image
              src={vehicle.coverImageUrl}
              alt={vehicle.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Car className="size-10" />
            </div>
          )}
          {vehicle.verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
              <BadgeCheck className="size-3.5" /> Verified
            </span>
          )}
        </div>

        <div className="space-y-2 p-4">
          <h3 className="line-clamp-1 font-semibold">{vehicle.name}</h3>
          <p className="text-lg font-bold">
            ₹{vehicle.leaseAmount.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-muted-foreground"> / {vehicle.leasePeriod}</span>
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {vehicle.registrationYear ? <span>{vehicle.registrationYear}</span> : null}
            {vehicle.fuelType ? <span>{vehicle.fuelType}</span> : null}
            {vehicle.transmission ? <span>{vehicle.transmission}</span> : null}
            {vehicle.kmDriven != null ? <span>{vehicle.kmDriven.toLocaleString("en-IN")} km</span> : null}
          </div>
          <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
            <span>{vehicle.districtName ?? "Kerala"}</span>
            {vehicle.publishedAt ? <span>{formatDistanceToNow(new Date(vehicle.publishedAt), { addSuffix: true })}</span> : null}
          </div>
        </div>
      </Link>
    </div>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="glass-surface overflow-hidden rounded-(--glass-radius-lg)">
      <div className="aspect-4/3 w-full animate-pulse bg-muted" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-3 w-full animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
