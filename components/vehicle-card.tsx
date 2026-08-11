import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BadgeCheck, Car } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import { cn } from "@/lib/utils";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

// Cards sit on top of a photo, so the icon buttons need a background that
// reads on any image rather than the site's translucent glass-surface
// (which picks up whatever colors are behind it and can wash out against a
// busy photo) — a flat dark tint stays legible over every listing photo.
const OVERLAY_ICON_CLASS = "border border-white/15 bg-black/40 text-white backdrop-blur-md hover:bg-black/60";

const FAVORITE_DISABLED_REASON = "This vehicle is already booked and can't be favorited right now.";

/** Grayscale photo + a scrim with visible "Already Booked" text (not just a
 * color change, which alone wouldn't reach screen readers or colorblind
 * users) — sits under the badges/icon buttons in z-order so those stay
 * legible and usable (Share in particular stays fully active on a booked
 * card; only Favorite is blocked). */
function BookedOverlay({ compact = false }: { compact?: boolean }) {
  return (
    <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/50">
      <span
        className={cn(
          "rounded-full bg-black/70 font-bold tracking-wide text-white uppercase",
          compact ? "px-2 py-0.5 text-[9px]" : "px-3 py-1.5 text-xs"
        )}
      >
        Already Booked
      </span>
    </div>
  );
}

export function VehicleCard({
  vehicle,
  favorited,
  view = "grid",
}: {
  vehicle: VehicleCardData;
  /** Only pass this when known for certain server-side (e.g. /favorites).
   * Otherwise omit it and FavoriteButton resolves it from client-side
   * context — see components/favorite-button.tsx. */
  favorited?: boolean;
  /** "list" renders a compact horizontal row (image left, details right)
   * for the /vehicles list-view mode; "grid" (default) is the standard
   * photo-first card used everywhere else. */
  view?: "grid" | "list";
}) {
  const isBooked = vehicle.bookingStatus === "booked";
  const cardImageUrl = vehicle.coverThumbnailUrl ?? vehicle.coverImageUrl;
  // Descriptive rather than generic — e.g. "2022 Hyundai Creta SX Diesel in
  // Kozhikode" — composed only from fields this card actually has.
  const altText = [vehicle.registrationYear, vehicle.name, vehicle.fuelType, vehicle.districtName ? `in ${vehicle.districtName}` : null]
    .filter(Boolean)
    .join(" ");

  const metaRow = (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {vehicle.registrationYear ? <span>{vehicle.registrationYear}</span> : null}
      {vehicle.fuelType ? <span>{vehicle.fuelType}</span> : null}
      {vehicle.transmission ? <span>{vehicle.transmission}</span> : null}
      {vehicle.kmDriven != null ? <span>{vehicle.kmDriven.toLocaleString("en-IN")} km</span> : null}
    </div>
  );

  const footerRow = (
    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
      <span>{vehicle.districtName ?? "Kerala"}</span>
      {vehicle.publishedAt ? <span>{formatDistanceToNow(new Date(vehicle.publishedAt), { addSuffix: true })}</span> : null}
    </div>
  );

  if (view === "list") {
    return (
      <div className="glass-surface glass-specular group relative flex gap-3 overflow-hidden rounded-(--glass-radius-lg) p-2 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-3">
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5 sm:right-5">
          <FavoriteButton
            vehicleId={vehicle.id}
            initialFavorited={favorited}
            disabled={isBooked}
            disabledReason={FAVORITE_DISABLED_REASON}
            className={`${OVERLAY_ICON_CLASS} size-7`}
          />
          <ShareButton slug={vehicle.slug} name={vehicle.name} className={`${OVERLAY_ICON_CLASS} size-7`} />
        </div>

        <Link href={`/vehicles/${vehicle.slug}`} className="flex min-w-0 flex-1 gap-3 text-foreground no-underline">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-(--glass-radius) bg-muted sm:size-32">
            {cardImageUrl ? (
              <Image
                src={cardImageUrl}
                alt={altText}
                fill
                sizes="128px"
                className={cn("object-cover transition duration-300 group-hover:scale-105", isBooked && "grayscale")}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Car className="size-8" />
              </div>
            )}
            {isBooked ? <BookedOverlay compact /> : null}
            {vehicle.verified && (
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                <BadgeCheck className="size-3" />
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 pr-12">
            <h3 className="line-clamp-1 font-semibold">{vehicle.name}</h3>
            <p className="text-base font-bold">
              ₹{vehicle.leaseAmount.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-muted-foreground"> / {vehicle.leasePeriod}</span>
            </p>
            {metaRow}
            {footerRow}
          </div>
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-surface glass-specular group relative overflow-hidden rounded-(--glass-radius-lg) transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <FavoriteButton
          vehicleId={vehicle.id}
          initialFavorited={favorited}
          disabled={isBooked}
          disabledReason={FAVORITE_DISABLED_REASON}
          className={OVERLAY_ICON_CLASS}
        />
        <ShareButton slug={vehicle.slug} name={vehicle.name} className={OVERLAY_ICON_CLASS} />
      </div>

      <Link href={`/vehicles/${vehicle.slug}`} className="block text-foreground no-underline">
        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
          {cardImageUrl ? (
            <Image
              src={cardImageUrl}
              alt={altText}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 50vw, 25vw"
              className={cn("object-cover transition duration-300 group-hover:scale-105", isBooked && "grayscale")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Car className="size-10" />
            </div>
          )}
          {isBooked ? <BookedOverlay /> : null}
          {vehicle.verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
              <BadgeCheck className="size-3.5" /> Verified
            </span>
          )}
          <span className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
            ₹{vehicle.leaseAmount.toLocaleString("en-IN")}
            <span className="font-normal text-muted-foreground"> /{vehicle.leasePeriod}</span>
          </span>
        </div>

        <div className="space-y-2 p-4">
          <h3 className="line-clamp-1 font-semibold">{vehicle.name}</h3>
          {metaRow}
          {footerRow}
        </div>
      </Link>
    </div>
  );
}

export function VehicleCardSkeleton({ view = "grid" }: { view?: "grid" | "list" }) {
  if (view === "list") {
    return (
      <div className="glass-surface flex gap-3 overflow-hidden rounded-(--glass-radius-lg) p-2 sm:p-3">
        <div className="size-24 shrink-0 animate-pulse rounded-(--glass-radius) bg-muted sm:size-32" />
        <div className="flex flex-1 flex-col justify-center gap-3">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

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
