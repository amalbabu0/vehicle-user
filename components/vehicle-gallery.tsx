"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Car } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; mediumUrl: string | null; thumbnailUrl: string | null };

export function VehicleGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-4/3 w-full items-center justify-center rounded-(--glass-radius-lg) bg-muted text-muted-foreground">
        <Car className="size-16" />
      </div>
    );
  }

  const active = images[activeIndex];

  return (
    <div className="space-y-3">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-(--glass-radius-lg) bg-muted">
        <Image
          src={active.mediumUrl ?? active.url}
          alt={`${name} — photo ${activeIndex + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-background/80 px-3 py-1 backdrop-blur-md">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold">Available for lease</span>
        </div>
        {images.length > 1 ? (
          <div className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-white backdrop-blur-md">
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
                "relative size-16 shrink-0 overflow-hidden rounded-lg border-2 transition",
                index === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <Image src={image.thumbnailUrl ?? image.url} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
