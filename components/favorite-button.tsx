"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/components/providers/favorites-provider";

export function FavoriteButton({
  vehicleId,
  initialFavorited,
  className,
  label,
  disabled = false,
  disabledReason = "This vehicle is already booked and can't be favorited right now.",
}: {
  vehicleId: string;
  /** Only pass this when the page already knows the answer for certain
   * (e.g. /favorites, where every card is trivially favorited). Everywhere
   * else, omit it and let the FavoritesProvider context resolve it
   * client-side — see components/providers/favorites-provider.tsx. */
  initialFavorited?: boolean;
  className?: string;
  label?: string;
  /** True for a booked vehicle. Blocks the action in the click handler
   * itself (not just the native `disabled` attribute) — a disabled-looking
   * button whose onClick still runs isn't actually disabled, and the
   * server (POST /api/favorites) rejects it too either way. */
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const { isFavorited, setFavorited: setContextFavorited } = useFavorites();
  const [isPending, startTransition] = useTransition();
  // Only set after the user actually clicks — an optimistic override on top
  // of whatever initialFavorited/context says, not a synced copy of it
  // (no effect needed: this is a plain derived value each render).
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const favorited = optimistic ?? initialFavorited ?? isFavorited(vehicleId) ?? false;

  const toggle = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
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
      setOptimistic(payload.favorited);
      setContextFavorited(vehicleId, payload.favorited);
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || isPending}
      aria-disabled={disabled}
      aria-pressed={favorited}
      aria-label={disabled ? disabledReason : favorited ? "Remove from favorites" : "Add to favorites"}
      title={disabled ? disabledReason : undefined}
      className={cn(
        label
          ? "glass-surface flex items-center justify-center gap-2 rounded-(--glass-radius) px-4 py-2.5 text-sm font-medium text-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          : "glass-surface flex size-9 items-center justify-center rounded-full text-foreground transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <Heart className={cn("size-4", favorited && "fill-red-500 text-red-500")} />
      {label ? <span>{disabled ? "Unavailable" : favorited ? "Saved to favorites" : label}</span> : null}
    </button>
  );
}
