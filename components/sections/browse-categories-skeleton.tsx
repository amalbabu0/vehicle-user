import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors BrowseCategories: header row, then a grid-cols-3 lg:grid-cols-6
 * grid of square icon tiles (6 — the count of every currently-iconed
 * category in CATEGORY_ICONS). Previously this section's Suspense fallback
 * was `null`, so the whole category strip popped into existence once
 * getCategoriesWithCounts() resolved, pushing everything below it down —
 * a real CLS hit, not just a cosmetic mismatch. */
export function BrowseCategoriesSkeleton() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-52 sm:h-9" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-(--glass-radius-lg)" />
          ))}
        </div>
      </div>
    </section>
  );
}
