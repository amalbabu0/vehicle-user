"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  vehicleId,
  initialFavorited = false,
  className,
  label,
}: {
  vehicleId: string;
  initialFavorited?: boolean;
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    startTransition(async () => {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicleId }),
      });
      if (response.status === 401) {
        router.push(`/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      if (!response.ok) return;
      const payload = await response.json();
      setFavorited(payload.favorited);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        label
          ? "glass-surface flex items-center justify-center gap-2 rounded-(--glass-radius) px-4 py-2.5 text-sm font-medium text-foreground transition hover:opacity-90 disabled:opacity-60"
          : "glass-surface flex size-9 items-center justify-center rounded-full text-foreground transition hover:scale-105 disabled:opacity-60",
        className
      )}
    >
      <Heart className={cn("size-4", favorited && "fill-red-500 text-red-500")} />
      {label ? <span>{favorited ? "Saved to favorites" : label}</span> : null}
    </button>
  );
}
