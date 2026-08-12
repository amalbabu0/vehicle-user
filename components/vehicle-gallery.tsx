"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Car, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { ShareButton } from "@/components/share-button";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; mediumUrl: string | null; thumbnailUrl: string | null };

// Matches the tint used on VehicleCard's overlay icons — see that file for
// why: a flat dark backing stays legible over any listing photo, unlike
// the site's translucent glass-surface which picks up the photo behind it.
// No backdrop-blur, also matching VehicleCard — bg-black/40 alone is
// legible and skips an extra compositing layer.
const OVERLAY_ICON_CLASS = "border border-white/15 bg-black/40 text-white hover:bg-black/60";

const FAVORITE_DISABLED_REASON = "This vehicle is already booked and can't be favorited right now.";

// Swipe must travel at least this far, and more horizontally than
// vertically, to count as a photo change rather than an incidental touch
// (a tap, or a vertical scroll attempt landing on the gallery).
const SWIPE_THRESHOLD_PX = 40;

/** Touch handlers for swipe-to-change-photo. Exposes `wasSwipe` so a caller
 * with its own tap handler (e.g. "open full screen") can skip that action
 * when the touch that just ended was actually a swipe, not a tap. */
function useSwipeStep(step: (delta: number) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const wasSwipe = useRef(false);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    const touch = event.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY };
    wasSwipe.current = false;
  }, []);

  const onTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.current.x;
      const deltaY = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      wasSwipe.current = true;
      step(deltaX < 0 ? 1 : -1);
    },
    [step]
  );

  return { onTouchStart, onTouchEnd, wasSwipe };
}

export function VehicleGallery({
  images,
  name,
  vehicleId,
  slug,
  favorited,
  isBooked = false,
}: {
  images: GalleryImage[];
  name: string;
  vehicleId: string;
  slug: string;
  /** Only pass this when known for certain server-side. Otherwise omit it
   * and FavoriteButton resolves it from client-side context. */
  favorited?: boolean;
  isBooked?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const count = images.length;
  const step = useCallback((delta: number) => setActiveIndex((i) => (i + delta + count) % count), [count]);
  const mainSwipe = useSwipeStep(step);
  const zoomSwipe = useSwipeStep(step);

  // Escape/arrow keys only while the full-screen viewer is open, and lock
  // background scroll so the page behind doesn't move under the overlay.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomed(false);
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [zoomed, step]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-4/3 w-full items-center justify-center rounded-(--glass-radius-lg) bg-muted text-muted-foreground">
        <Car className="size-24" />
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div className="space-y-3">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-(--glass-radius-lg) bg-muted">
        {/* The photo itself is the tap target for the full-screen viewer.
            Absolutely positioned so next/image's `fill` still measures
            against it, and left below the overlay controls in z-order so
            Favorite/Share stay clickable. */}
        <button
          type="button"
          onClick={() => {
            if (mainSwipe.wasSwipe.current) return;
            setZoomed(true);
          }}
          onTouchStart={mainSwipe.onTouchStart}
          onTouchEnd={mainSwipe.onTouchEnd}
          aria-label={`View photo ${activeIndex + 1} of ${name} full screen`}
          className="absolute inset-0 cursor-zoom-in"
        >
          <Image
            src={active.mediumUrl ?? active.url}
            alt={`${name} — photo ${activeIndex + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 60vw"
            className={cn("object-cover", isBooked && "grayscale")}
          />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            <Expand className="size-4" /> Tap to enlarge
          </span>
        </button>
        {/* These three are labels, not controls — `pointer-events-none` keeps
            the whole photo tappable underneath them. Without it the booked
            scrim in particular covers the entire image and swallows the tap. */}
        {isBooked ? (
          <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-black/70 px-4 py-2 text-sm font-bold tracking-wide text-white uppercase">Already Booked</span>
          </div>
        ) : (
          <div className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-background/80 px-3 py-1 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-xs font-semibold">Available for lease</span>
          </div>
        )}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <FavoriteButton
            vehicleId={vehicleId}
            initialFavorited={favorited}
            disabled={isBooked}
            disabledReason={FAVORITE_DISABLED_REASON}
            className={OVERLAY_ICON_CLASS}
          />
          <ShareButton slug={slug} name={name} className={OVERLAY_ICON_CLASS} />
        </div>
        {images.length > 1 ? (
          <div className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-white backdrop-blur-md">
            <Camera className="size-3.5" />
            <span className="text-xs font-medium">
              {activeIndex + 1}/{images.length}
            </span>
          </div>
        ) : null}
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View photo ${index + 1} of ${name}`}
              aria-current={index === activeIndex}
              className={cn(
                "relative size-20 shrink-0 overflow-hidden rounded-lg border-2 transition sm:size-24",
                index === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image
                src={image.thumbnailUrl ?? image.url}
                alt=""
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className={cn("object-cover", isBooked && "grayscale")}
              />
            </button>
          ))}
        </div>
      ) : null}

      {zoomed ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${name} — photo ${activeIndex + 1} of ${count}`}
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">
              {activeIndex + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => setZoomed(false)}
              aria-label="Close full screen photo"
              className="inline-flex size-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              autoFocus
            >
              <X className="size-6" />
            </button>
          </div>

          {/* Full-resolution source, contained rather than cropped — the
              point of this view is seeing the whole photo, not filling the
              viewport with part of it. */}
          <div className="relative min-h-0 flex-1" onTouchStart={zoomSwipe.onTouchStart} onTouchEnd={zoomSwipe.onTouchEnd}>
            <Image
              src={active.url}
              alt={`${name} — photo ${activeIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {count > 1 ? (
            <div className="flex items-center justify-center gap-6 px-4 py-5">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photo"
                className="inline-flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photo"
                className="inline-flex size-12 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
            </div>
          ) : (
            <div className="pb-5" />
          )}
        </div>
      ) : null}
    </div>
  );
}
