import Link from "next/link";
import { ArrowRight, Car, Bike, Scooter, CarFront, Zap, Truck, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCategoriesWithCounts } from "@/lib/data/home";

// Keyed by slug (admin migration 0011) rather than name, since slugs are
// the stable identifier — a category's display name can be edited later
// without silently losing its icon.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  cars: Car,
  bikes: Bike,
  scooters: Scooter,
  suvs: CarFront,
  evs: Zap,
  "commercial-vehicles": Truck,
};

export async function BrowseCategories() {
  const categories = await getCategoriesWithCounts();
  if (categories.length === 0) return null;

  return (
    // Full-bleed section so the wash can run edge to edge; the content keeps
    // its own max-w-7xl inside. Anchoring the gradient to a max-width
    // container instead would cut it off with a visible hard edge on wide
    // screens.
    <section className="relative overflow-hidden py-12">
      {/* Same two-stop radial motif as the hero (see hero-content.tsx), with
          the circles mirrored to the opposite corners so scrolling from one
          section to the next reads as rhythm rather than a repeat. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_15%,color-mix(in_oklch,var(--primary),transparent_90%),transparent_55%),radial-gradient(circle_at_10%_85%,color-mix(in_oklch,var(--primary),transparent_93%),transparent_50%)]"
      />
      {/* The hairline the footer uses to cap the page, reused here to part
          the hero from the catalog without a flat border. */}
      <div aria-hidden className="mx-auto mb-10 h-px max-w-7xl bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center md:text-left">
          <h2 className="text-3xl font-semibold sm:text-4xl">Browse by category</h2>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Every kind of vehicle available for lease across Kerala — pick a category to start.
          </p>
        </div>

        {/* Square icon tiles, 3-up on phones and 6-up from lg. The icon carries
            the tile; the label is deliberately small and secondary rather than
            dropped entirely, because categories are database rows — only the
            six slugs above have a glyph and anything else falls back to the
            car icon, so an unlabelled tile would be indistinguishable from its
            neighbours the moment a new category is added. */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
          {categories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] ?? Car;
            return (
              <Link
                key={category.id}
                href={`/vehicles?category=${category.slug}`}
                aria-label={`${category.name} — ${category.count.toLocaleString("en-IN")} vehicle${category.count === 1 ? "" : "s"} available for lease`}
                className="glass-surface glass-specular group flex aspect-square flex-col items-center justify-center gap-2 rounded-(--glass-radius-lg) p-2 text-center no-underline transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <Icon className="size-10 text-muted-foreground transition duration-300 group-hover:scale-105 group-hover:text-primary sm:size-12" />
                <span className="line-clamp-2 text-xs font-medium text-foreground sm:text-sm">{category.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center md:justify-start">
          <Link href="/vehicles" className="no-underline">
            <Button size="lg" className="group rounded-full">
              View entire inventory
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
