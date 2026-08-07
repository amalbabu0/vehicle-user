"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FUEL_TYPES, TRANSMISSIONS } from "@/lib/constants/vehicle-options";
import type { DistrictOption } from "@/lib/data/locations";
import type { CategoryWithCount } from "@/lib/data/home";
import type { FilterableBrand } from "@/lib/data/search";

const ANY = "any";

export function VehicleFiltersPanel({
  districts,
  categories,
  brands,
}: {
  districts: DistrictOption[];
  categories: CategoryWithCount[];
  brands: FilterableBrand[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ANY) params.delete(key);
    else params.set(key, value);
    router.push(`/vehicles?${params.toString()}`);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (q !== (searchParams.get("q") ?? "")) set("q", q);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const activeFilterCount = [...searchParams.keys()].filter((k) => k !== "offset").length;

  return (
    <div className="glass-surface space-y-4 rounded-(--glass-radius-lg) p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        {activeFilterCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => router.push("/vehicles")} className="gap-1 text-xs">
            <X className="size-3.5" /> Clear all
          </Button>
        ) : null}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand or model" className="pl-9" />
      </div>

      <FilterSelect label="Sort by" paramKey="sort" value={searchParams.get("sort") ?? "latest"} onChange={set}>
        <SelectItem value="latest">Newest first</SelectItem>
        <SelectItem value="price_asc">Price: low to high</SelectItem>
        <SelectItem value="price_desc">Price: high to low</SelectItem>
        <SelectItem value="popular">Most viewed</SelectItem>
      </FilterSelect>

      <FilterSelect label="Vehicle type" paramKey="category" value={searchParams.get("category") ?? ANY} onChange={set}>
        <SelectItem value={ANY}>Any type</SelectItem>
        {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name} ({c.count})</SelectItem>)}
      </FilterSelect>

      <FilterSelect label="Brand" paramKey="brand" value={searchParams.get("brand") ?? ANY} onChange={set}>
        <SelectItem value={ANY}>Any brand</SelectItem>
        {brands.map((b) => <SelectItem key={b.id} value={b.slug}>{b.name}</SelectItem>)}
      </FilterSelect>

      <FilterSelect label="District" paramKey="district" value={searchParams.get("district") ?? ANY} onChange={set}>
        <SelectItem value={ANY}>All Kerala</SelectItem>
        {districts.map((d) => <SelectItem key={d.id} value={d.slug}>{d.name}</SelectItem>)}
      </FilterSelect>

      <FilterSelect label="Fuel type" paramKey="fuelType" value={searchParams.get("fuelType") ?? ANY} onChange={set}>
        <SelectItem value={ANY}>Any fuel</SelectItem>
        {FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
      </FilterSelect>

      <FilterSelect label="Transmission" paramKey="transmission" value={searchParams.get("transmission") ?? ANY} onChange={set}>
        <SelectItem value={ANY}>Any transmission</SelectItem>
        {TRANSMISSIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
      </FilterSelect>

      <FilterSelect label="Owner type" paramKey="ownerType" value={searchParams.get("ownerType") ?? ANY} onChange={set}>
        <SelectItem value={ANY}>Any owner</SelectItem>
        <SelectItem value="direct">Direct owner</SelectItem>
        <SelectItem value="agent">Agent</SelectItem>
      </FilterSelect>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Price range (₹/period)</label>
        <div className="mt-1.5 flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Min"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => set("minPrice", e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="Max"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => set("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">Year</label>
        <Input
          type="number"
          inputMode="numeric"
          placeholder="e.g. 2021"
          className="mt-1.5"
          defaultValue={searchParams.get("year") ?? ""}
          onBlur={(e) => set("year", e.target.value)}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  paramKey,
  value,
  onChange,
  children,
}: {
  label: string;
  paramKey: string;
  value: string;
  onChange: (key: string, value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={(v) => onChange(paramKey, v)}>
        <SelectTrigger className="mt-1.5 w-full"><SelectValue /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}
