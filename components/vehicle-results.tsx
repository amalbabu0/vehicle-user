"use client";

import { useSyncExternalStore } from "react";
import { LayoutGrid, Columns3, List as ListIcon } from "lucide-react";
import { InfiniteVehicleGrid } from "@/components/infinite-vehicle-grid";
import { cn } from "@/lib/utils";
import type { VehicleCardData } from "@/lib/types/vehicle-card";

type ViewMode = "grid" | "column" | "list";
type VehicleWithFavorite = VehicleCardData & { favorited?: boolean };

const STORAGE_KEY = "klh:vehicles-view";

const VIEW_OPTIONS: { value: ViewMode; label: string; icon: typeof LayoutGrid }[] = [
  { value: "grid", label: "Grid view", icon: LayoutGrid },
  { value: "column", label: "Column view", icon: Columns3 },
  { value: "list", label: "List view", icon: ListIcon },
];

// The stored view preference is external state (localStorage), so it's read
// through useSyncExternalStore rather than "read in a useEffect and
// setState" — that pattern is both a lint violation (cascading render) and
// exactly what this hook exists to replace. The server (and the client's
// first paint, before hydration) always sees "column"; the real stored
// value (if any) takes over immediately after, with no flash of mismatched
// markup since useSyncExternalStore handles that hydration handoff itself.
const listeners = new Set<() => void>();

function isViewMode(value: string | null): value is ViewMode {
  return value === "grid" || value === "column" || value === "list";
}

function getViewSnapshot(): ViewMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isViewMode(stored) ? stored : "column";
}

function getViewServerSnapshot(): ViewMode {
  return "column";
}

function subscribeToView(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function setStoredView(next: ViewMode) {
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((listener) => listener());
}

export function VehicleResults({
  initialVehicles,
  initialCursor,
  filtersQueryString,
}: {
  initialVehicles: VehicleWithFavorite[];
  initialCursor: string | null;
  filtersQueryString: string;
}) {
  const view = useSyncExternalStore(subscribeToView, getViewSnapshot, getViewServerSnapshot);
  const changeView = (next: ViewMode) => setStoredView(next);

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-background p-1">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => changeView(option.value)}
              aria-label={option.label}
              aria-pressed={view === option.value}
              className={cn(
                "flex size-8 items-center justify-center rounded-md transition",
                view === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <option.icon className="size-4" />
            </button>
          ))}
        </div>
      </div>

      <InfiniteVehicleGrid
        key={filtersQueryString}
        initialVehicles={initialVehicles}
        initialCursor={initialCursor}
        filtersQueryString={filtersQueryString}
        view={view}
      />
    </div>
  );
}
