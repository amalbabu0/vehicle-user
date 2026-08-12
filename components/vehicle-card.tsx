import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Car } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import { cn } from "@/lib/utils";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

// Cards sit on top of a photo, so the icon buttons need a background that
// reads on any image rather than the site's translucent glass-surface
// (which picks up whatever colors are behind it and can wash out against a
// busy photo) — a flat dark tint stays legible over every listing photo.
// No backdrop-blur here: bg-black/40 alone already reads fine over a photo,
// and this class gets stamped onto two buttons on every card in the grid —
// with dozens of cards on screen (and more arriving via infinite scroll),
// that many live backdrop-filter layers is a real scroll-jank cost for a
// blur that isn't buying much on top of the opaque-ish background.
const OVERLAY_ICON_CLASS = "border border-white/15 bg-black/40 text-white hover:bg-black/60";

// Cards mount and unmount off-screen constantly on the infinite-scroll
// grids (/vehicles, homepage sections) — content-visibility skips layout
// and paint for cards outside the viewport instead of paying for all of
// them up front. containIntrinsicSize is just a placeholder box so the
// scrollbar doesn't jump before a card's real size is known.
const offscreenSkip = (heightPx: number): React.CSSProperties => ({
  contentVisibility: "auto",
  containIntrinsicSize: `auto ${heightPx}px`,
});

const FAVORITE_DISABLED_REASON = "This vehicle is already booked and can't be favorited right now.";

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** "21h ago", not date-fns's "about 21 hours ago". The footer row has roughly
 * 130px of text width in a 2-up card on a 375px phone; the long form doesn't
 * fit beside the district name, so it wrapped to two lines and the
 * vertically-centred location ended up colliding with it. The full timestamp
 * is still available as the `title`/`dateTime` on the element. */
function compactAgo(published: string): string | null {
  const publishedAt = new Date(published).getTime();
  // An unparseable date makes every comparison below false and the function
  // falls through to the final branch, rendering the string "NaNy ago" in
  // the card. Bail out instead and let the caller omit the element.
  if (Number.isNaN(publishedAt)) return null;

  const seconds = Math.max(0, (Date.now() - publishedAt) / 1000);
  if (seconds < MINUTE) return "just now";
  if (seconds < HOUR) return `${Math.floor(seconds / MINUTE)}m ago`;
  if (seconds < DAY) return `${Math.floor(seconds / HOUR)}h ago`;
  if (seconds < MONTH) return `${Math.floor(seconds / DAY)}d ago`;
  if (seconds < YEAR) return `${Math.floor(seconds / MONTH)}mo ago`;
  return `${Math.floor(seconds / YEAR)}y ago`;
}

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

/** The card is dropped into grids of different column counts (1-up on
 * /vehicles column view, 2-up on the homepage rows), and next/image can't
 * infer that. Default to the 1-up case: guessing too small serves a
 * visibly soft photo, guessing too large only costs bytes — and legibility
 * of the photo is the whole point of the card. 2-up callers override. */
const DEFAULT_GRID_IMAGE_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";

export function VehicleCard({
  vehicle,
  favorited,
  view = "grid",
  imageSizes = DEFAULT_GRID_IMAGE_SIZES,
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
  /** next/image `sizes` for the grid-view photo. Pass the real per-breakpoint
   * width when this card sits in a multi-column grid. Ignored in list view,
   * where the thumbnail is a fixed size. */
  imageSizes?: string;
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

  const publishedLabel = vehicle.publishedAt ? compactAgo(vehicle.publishedAt) : null;

  // One line, always: the district truncates if it's long, the timestamp
  // never wraps and never shrinks. `min-w-0` is what actually lets the
  // district shrink — a flex item defaults to min-width:auto, so without it
  // neither side gives and the row overflows instead of ellipsising.
  const footerRow = (
    <div className="flex items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
      <span className="min-w-0 truncate">{vehicle.districtName ?? "Kerala"}</span>
      {vehicle.publishedAt && publishedLabel ? (
        // This is a Server Component, so the tooltip is formatted on the
        // server — pin the zone to IST rather than inheriting whatever
        // region the function happens to run in, which would show a
        // Kerala user a UTC time 5.5 hours off. `dateTime` stays the raw
        // ISO value for machines.
        <time
          dateTime={vehicle.publishedAt}
          title={new Date(vehicle.publishedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          className="shrink-0 whitespace-nowrap"
        >
          {publishedLabel}
        </time>
      ) : null}
    </div>
  );

  if (view === "list") {
    return (
      <div
        className="glass-surface glass-specular group relative flex gap-3 overflow-hidden rounded-(--glass-radius-lg) p-2 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:p-3"
        style={offscreenSkip(144)}
      >
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-1.5 sm:right-5">
          <FavoriteButton
            vehicleId={vehicle.id}
            initialFavorited={favorited}
            disabled={isBooked}
            disabledReason={FAVORITE_DISABLED_REASON}
            className={`${OVERLAY_ICON_CLASS} size-9`}
          />
          <ShareButton slug={vehicle.slug} name={vehicle.name} className={`${OVERLAY_ICON_CLASS} size-9`} />
        </div>

        <Link href={`/vehicles/${vehicle.slug}`} className="flex min-w-0 flex-1 gap-3 text-foreground no-underline">
          <div className="relative size-32 shrink-0 overflow-hidden rounded-(--glass-radius) bg-muted sm:size-40">
            {cardImageUrl ? (
              <Image
                src={cardImageUrl}
                alt={altText}
                fill
                sizes="(max-width: 640px) 128px, 160px"
                className={cn("object-cover transition duration-300 group-hover:scale-105", isBooked && "grayscale")}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Car className="size-11" />
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
    <div
      className="glass-surface glass-specular group relative overflow-hidden rounded-(--glass-radius-lg) transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={offscreenSkip(280)}
    >
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
              sizes={imageSizes}
              className={cn("object-cover transition duration-300 group-hover:scale-105", isBooked && "grayscale")}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Car className="size-14" />
            </div>
          )}
          {isBooked ? <BookedOverlay /> : null}
          {vehicle.verified && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
              <BadgeCheck className="size-3.5" /> Verified
            </span>
          )}
          <span className="absolute bottom-2 left-2 rounded bg-background/80 px-2 py-1 text-xs font-semibold">
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
        <div className="size-32 shrink-0 animate-pulse rounded-(--glass-radius) bg-muted sm:size-40" />
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
