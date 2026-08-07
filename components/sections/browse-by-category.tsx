import Link from "next/link";
import { Car, Bike, Zap, Truck } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/data/home";

const ICONS: Record<string, typeof Car> = {
  cars: Car,
  suvs: Car,
  bikes: Bike,
  scooters: Bike,
  evs: Zap,
  "commercial-vehicles": Truck,
};

export async function BrowseByCategory() {
  const categories = await getCategoriesWithCounts();
  if (categories.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold sm:text-3xl">Browse by category</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => {
          const Icon = ICONS[category.slug] ?? Car;
          return (
            <Link
              key={category.id}
              href={`/vehicles?category=${category.slug}`}
              className="glass-surface flex flex-col items-center gap-2 rounded-(--glass-radius-lg) p-5 text-center no-underline text-foreground transition hover:-translate-y-1 hover:shadow-lg"
            >
              <Icon className="size-7 text-primary" />
              <span className="text-sm font-medium">{category.name}</span>
              <span className="text-xs text-muted-foreground">{category.count} listing{category.count === 1 ? "" : "s"}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
