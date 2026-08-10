import type { Metadata } from "next";
import { searchVehicles, searchVehiclesByPage, parseFiltersFromSearchParams, getFilterableBrands, type VehicleFilters } from "@/lib/data/search";
import { getDistricts } from "@/lib/data/locations";
import { getCategoriesWithCounts } from "@/lib/data/home";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { VehicleFiltersPanel } from "@/components/vehicle-filters-panel";
import { VehicleFiltersMobile } from "@/components/vehicle-filters-mobile";
import { InfiniteVehicleGrid } from "@/components/infinite-vehicle-grid";
import { VehicleCard } from "@/components/vehicle-card";
import { VehiclePagination } from "@/components/vehicle-pagination";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-jsonld";
import { env } from "@/lib/env";
import { buildPageOg } from "@/lib/seo/page-metadata";

const PAGE_SIZE = 20;

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function buildQueryString(rawParams: Record<string, string | string[] | undefined>, omit: string[] = []) {
  return new URLSearchParams(
    Object.entries(rawParams).flatMap(([key, value]) =>
      value == null || omit.includes(key) ? [] : Array.isArray(value) ? value.map((v) => [key, v] as [string, string]) : [[key, value] as [string, string]]
    )
  );
}

// Canonical is built from the *parsed* filters in a fixed key order, not
// from raw searchParams — two URLs differing only in query-param order
// (?brand=honda&fuelType=petrol vs. ?fuelType=petrol&brand=honda) are the
// same content and must self-canonicalize to the same URL, or Google sees
// them as duplicate pages competing against each other.
function buildCanonicalQueryString(filters: VehicleFilters, page: number) {
  const qs = new URLSearchParams();
  if (filters.q) qs.set("q", filters.q);
  if (filters.brand) qs.set("brand", filters.brand);
  if (filters.category) qs.set("category", filters.category);
  if (filters.district) qs.set("district", filters.district);
  if (filters.fuelType) qs.set("fuelType", filters.fuelType);
  if (filters.transmission) qs.set("transmission", filters.transmission);
  if (filters.minPrice != null) qs.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) qs.set("maxPrice", String(filters.maxPrice));
  if (filters.year != null) qs.set("year", String(filters.year));
  if (filters.ownerType) qs.set("ownerType", filters.ownerType);
  if (filters.condition) qs.set("condition", filters.condition);
  if (filters.sort) qs.set("sort", filters.sort);
  if (page > 1) qs.set("page", String(page));
  return qs;
}

// Two distinct result shapes normalized to one, so the page component can
// destructure either branch identically — see lib/data/search.ts for why
// these are two separate underlying queries (cursor vs. offset) rather
// than a single function.
async function getPaginatedResults(filters: VehicleFilters, page: number) {
  const result = await searchVehiclesByPage(filters, page, PAGE_SIZE);
  return { vehicles: result.vehicles, total: result.total, totalPages: result.totalPages, nextCursor: null as string | null };
}

async function getInfiniteScrollResults(filters: VehicleFilters) {
  const result = await searchVehicles(filters, PAGE_SIZE, null);
  return { vehicles: result.vehicles, total: result.total, totalPages: Math.max(1, Math.ceil(result.total / PAGE_SIZE)), nextCursor: result.nextCursor };
}

// generateMetadata (not a static export) because the canonical needs to
// reflect the current page number — each paginated page gets its own
// self-referencing canonical rather than all pointing at page 1, which
// would hide pages 2+ from the index entirely (a common pagination-SEO
// mistake Google explicitly warns against).
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const rawParams = await searchParams;
  const page = Math.max(1, Number(rawParams.page) || 1);
  const filters = parseFiltersFromSearchParams(rawParams);
  const qs = buildCanonicalQueryString(filters, page);
  const canonical = qs.toString() ? `/vehicles?${qs.toString()}` : "/vehicles";
  const title = page > 1 ? `Browse Vehicles — Page ${page}` : "Browse Vehicles";
  const description = "Browse cars, bikes, and every kind of vehicle available for lease across Kerala — filter by brand, price, fuel type, transmission, and district.";

  return {
    title,
    description,
    alternates: { canonical },
    ...buildPageOg({ title, description, path: canonical }),
  };
}

export default async function VehiclesSearchPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const filters = parseFiltersFromSearchParams(rawParams);
  const requestedPage = Math.max(1, Number(rawParams.page) || 1);

  const [districts, categories, brands] = await Promise.all([getDistricts(), getCategoriesWithCounts(), getFilterableBrands()]);

  const filtersQueryString = buildQueryString(rawParams, ["page"]).toString();
  const activeFilterCount = Object.keys(rawParams).filter((key) => key !== "cursor" && key !== "page" && rawParams[key]).length;

  // Page 1 (the default, no ?page in the URL) keeps today's cursor-seeded
  // infinite-scroll experience for human visitors. Any explicit ?page=N is
  // a classic offset-paginated view instead — this is the crawlable path:
  // a real, self-contained page of results with server-rendered Prev/Next
  // links, reachable without executing any scroll/JS interaction. See
  // lib/data/search.ts for why these are two separate query functions
  // rather than one.
  const isPaginatedView = requestedPage > 1;
  const { vehicles, total, totalPages, nextCursor } = isPaginatedView
    ? await getPaginatedResults(filters, requestedPage)
    : await getInfiniteScrollResults(filters);

  // Favorited state is resolved client-side (FavoritesProvider), not here —
  // this keeps the page itself free of cookies()-dependent calls so it can
  // be statically rendered/cached (see PERFORMANCE.md). `undefined`, not
  // `false`: VehicleCard/FavoriteButton treat an explicit `false` as a known
  // answer (skipping the context lookup), which would be wrong here.
  const vehiclesWithFavorite = vehicles.map((vehicle) => ({ ...vehicle, favorited: undefined as boolean | undefined }));
  const baseSearchParams = buildQueryString(rawParams, ["page", "cursor"]);

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

          <div>
            {isPaginatedView ? (
              vehicles.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">No vehicles on this page.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                  {vehiclesWithFavorite.map((vehicle) => (
                    <VehicleCard key={vehicle.id} vehicle={vehicle} />
                  ))}
                </div>
              )
            ) : (
              <InfiniteVehicleGrid
                key={filtersQueryString}
                initialVehicles={vehiclesWithFavorite}
                initialCursor={nextCursor}
                filtersQueryString={filtersQueryString}
              />
            )}

            {/* Always rendered, including on page 1 — this is what lets a
                crawler discover /vehicles?page=2 from a plain link on the
                very first page, without needing to execute infinite-scroll
                JS at all. */}
            <VehiclePagination page={requestedPage} totalPages={totalPages} baseSearchParams={baseSearchParams} />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
