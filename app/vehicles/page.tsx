import type { Metadata } from "next";
import { searchVehicles, parseFiltersFromSearchParams, getFilterableBrands } from "@/lib/data/search";
import { getFavoriteVehicleIds } from "@/lib/data/favorites";
import { getDistricts } from "@/lib/data/locations";
import { getCategoriesWithCounts } from "@/lib/data/home";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { VehicleFiltersPanel } from "@/components/vehicle-filters-panel";
import { VehicleFiltersMobile } from "@/components/vehicle-filters-mobile";
import { InfiniteVehicleGrid } from "@/components/infinite-vehicle-grid";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";
import { env } from "@/lib/env";

const PAGE_SIZE = 20;

export const metadata: Metadata = {
  title: "Browse Vehicles",
  description: "Browse used cars and bikes for sale or lease across Kerala — filter by brand, price, fuel type, transmission, and district.",
  alternates: { canonical: "/vehicles" },
};

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function VehiclesSearchPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters = parseFiltersFromSearchParams(rawParams);

  const [{ vehicles, hasMore, total }, favoriteIds, districts, categories, brands] = await Promise.all([
    searchVehicles(filters, PAGE_SIZE, 0),
    getFavoriteVehicleIds(),
    getDistricts(),
    getCategoriesWithCounts(),
    getFilterableBrands(),
  ]);

  const vehiclesWithFavorite = vehicles.map((vehicle) => ({ ...vehicle, favorited: favoriteIds.has(vehicle.id) }));
  const filtersQueryString = new URLSearchParams(
    Object.entries(rawParams).flatMap(([key, value]) =>
      value == null ? [] : Array.isArray(value) ? value.map((v) => [key, v] as [string, string]) : [[key, value] as [string, string]]
    )
  ).toString();
  const activeFilterCount = Object.keys(rawParams).filter((key) => key !== "offset" && rawParams[key]).length;

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Home", url: env.SITE_URL }, { name: "Vehicles", url: `${env.SITE_URL}/vehicles` }]} />
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">Browse vehicles</h1>
            <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString("en-IN")} vehicle{total === 1 ? "" : "s"} found</p>
          </div>
        </div>

        <div className="mt-4 lg:hidden">
          <VehicleFiltersMobile districts={districts} categories={categories} brands={brands} activeFilterCount={activeFilterCount} />
        </div>

        <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
            <VehicleFiltersPanel districts={districts} categories={categories} brands={brands} />
          </aside>

          <InfiniteVehicleGrid
            key={filtersQueryString}
            initialVehicles={vehiclesWithFavorite}
            initialHasMore={hasMore}
            filtersQueryString={filtersQueryString}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
