"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/vehicle-options";
import type { DistrictOption } from "@/lib/data/locations";
import type { CategoryWithCount } from "@/lib/data/home";

const PRICE_RANGES = [
  { label: "Any budget", min: "", max: "" },
  { label: "Under ₹10,000/mo", min: "", max: "10000" },
  { label: "₹10,000 – ₹25,000/mo", min: "10000", max: "25000" },
  { label: "₹25,000 – ₹50,000/mo", min: "25000", max: "50000" },
  { label: "Above ₹50,000/mo", min: "50000", max: "" },
];

const ANY = "any";

export function HeroSearchForm({ districts, categories }: { districts: DistrictOption[]; categories: CategoryWithCount[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState(ANY);
  const [category, setCategory] = useState(ANY);
  const [fuelType, setFuelType] = useState(ANY);
  const [transmission, setTransmission] = useState(ANY);
  const [priceRange, setPriceRange] = useState("0");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [district, category, fuelType, transmission].filter((value) => value !== ANY).length + (priceRange !== "0" ? 1 : 0);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (district !== ANY) params.set("district", district);
    if (category !== ANY) params.set("category", category);
    if (fuelType !== ANY) params.set("fuelType", fuelType);
    if (transmission !== ANY) params.set("transmission", transmission);
    const range = PRICE_RANGES[Number(priceRange)];
    if (range?.min) params.set("minPrice", range.min);
    if (range?.max) params.set("maxPrice", range.max);
    router.push(`/vehicles${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-surface glass-specular w-full max-w-2xl rounded-(--glass-radius-lg) p-4 sm:p-6">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by model or brand"
            className="h-12 pl-10 text-base"
            aria-label="Search vehicles"
          />
        </div>

        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button type="button" variant="outline" size="icon" className="relative size-12 shrink-0" aria-label="Filters">
              <SlidersHorizontal className="size-4" />
              {activeFilterCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
            <SheetTitle className="px-4 pt-4">Filters</SheetTitle>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger aria-label="Location" className="w-full"><SelectValue placeholder="Location" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All Kerala</SelectItem>
                  {districts.map((d) => <SelectItem key={d.id} value={d.slug}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Vehicle type" className="w-full"><SelectValue placeholder="Vehicle type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any type</SelectItem>
                  {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger aria-label="Price range" className="w-full"><SelectValue placeholder="Price range" /></SelectTrigger>
                <SelectContent>
                  {PRICE_RANGES.map((range, index) => <SelectItem key={range.label} value={String(index)}>{range.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger aria-label="Fuel type" className="w-full"><SelectValue placeholder="Fuel type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any fuel</SelectItem>
                  {FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={transmission} onValueChange={setTransmission}>
                <SelectTrigger aria-label="Transmission" className="w-full"><SelectValue placeholder="Transmission" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>Any transmission</SelectItem>
                  {TRANSMISSIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="p-4 pt-0">
              <Button type="button" className="w-full" onClick={() => setFiltersOpen(false)}>
                Apply filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <Button type="submit" className="mt-3 h-12 w-full text-base">
        <Search className="size-4" /> Search vehicles
      </Button>
    </form>
  );
}
