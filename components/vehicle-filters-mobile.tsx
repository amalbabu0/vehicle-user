"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VehicleFiltersPanel } from "@/components/vehicle-filters-panel";
import type { DistrictOption } from "@/lib/data/locations";
import type { CategoryWithCount } from "@/lib/data/home";
import type { FilterableBrand } from "@/lib/data/search";

export function VehicleFiltersMobile({
  districts,
  categories,
  brands,
  activeFilterCount,
}: {
  districts: DistrictOption[];
  categories: CategoryWithCount[];
  brands: FilterableBrand[];
  activeFilterCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-left transition hover:border-primary/50"
          >
            <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-sm text-muted-foreground">Filters</span>
            {activeFilterCount > 0 ? (
              <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetTitle className="px-4 pt-4">Filters</SheetTitle>
          <div className="p-4 pt-0">
            <VehicleFiltersPanel districts={districts} categories={categories} brands={brands} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
