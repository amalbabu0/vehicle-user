import Link from "next/link";
import { MapPin } from "lucide-react";
import { getDistricts } from "@/lib/data/locations";

export async function BrowseByDistrict() {
  const districts = await getDistricts();
  if (districts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold sm:text-3xl">Browse by district</h2>
      <div className="mt-6 flex flex-wrap gap-2">
        {districts.map((district) => (
          <Link
            key={district.id}
            href={`/vehicles?district=${district.slug}`}
            className="glass-surface inline-flex items-center gap-1.5 rounded-(--glass-radius-pill) px-4 py-2 text-sm font-medium no-underline text-foreground transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <MapPin className="size-3.5 text-primary" /> {district.name}
          </Link>
        ))}
      </div>
    </section>
  );
}
