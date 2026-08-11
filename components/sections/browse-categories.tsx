import Link from "next/link";
import { Car, Bike, Scooter, CarFront, Zap, Truck, type LucideIcon } from "lucide-react";
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
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold sm:text-3xl">Browse by category</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.slug] ?? Car;
          return (
            <Link
              key={category.id}
              href={`/vehicles?category=${category.slug}`}
              className="group flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-5 no-underline transition hover:border-primary/50 hover:bg-muted/50"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-6" />
              </span>
              <span>
                <span className="block font-medium text-foreground">{category.name}</span>
                <span className="block text-sm text-muted-foreground">
                  {category.count.toLocaleString("en-IN")} vehicle{category.count === 1 ? "" : "s"}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
