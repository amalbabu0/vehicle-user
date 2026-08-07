"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type FavoritesContextValue = {
  /** undefined = not loaded yet, so callers can distinguish "unknown" from "no" */
  isFavorited: (vehicleId: string) => boolean | undefined;
  setFavorited: (vehicleId: string, favorited: boolean) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/**
 * Loads the signed-in user's favorite vehicle ids once, client-side, via
 * /api/favorites/ids — this used to be a server-side fetch
 * (getFavoriteVehicleIds) called from every page that renders a
 * VehicleCard, which forced those pages into dynamic (per-request)
 * rendering just to know one user's favorites. Now it's a progressive
 * client-side overlay on top of an otherwise-static page. See
 * PERFORMANCE.md's "Status" section.
 */
export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/favorites/ids")
      .then((res) => (res.ok ? res.json() : { ids: [] }))
      .then((payload) => {
        if (active) setIds(new Set(payload.ids ?? []));
      })
      .catch(() => {
        if (active) setIds(new Set());
      });
    return () => {
      active = false;
    };
  }, []);

  const isFavorited = useCallback((vehicleId: string) => (ids ? ids.has(vehicleId) : undefined), [ids]);

  const setFavorited = useCallback((vehicleId: string, favorited: boolean) => {
    setIds((prev) => {
      const next = new Set(prev ?? []);
      if (favorited) next.add(vehicleId);
      else next.delete(vehicleId);
      return next;
    });
  }, []);

  return <FavoritesContext.Provider value={{ isFavorited, setFavorited }}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
