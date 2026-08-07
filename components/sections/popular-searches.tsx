import Link from "next/link";
import { getPopularSearches } from "@/lib/data/home";

export async function PopularSearches() {
  const searches = await getPopularSearches();
  if (searches.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold sm:text-3xl">Popular searches</h2>
      <div className="mt-6 flex flex-wrap gap-2">
        {searches.map((search) => (
          <Link
            key={search.label}
            href={`/vehicles?q=${encodeURIComponent(search.model ?? search.label)}`}
            className="rounded-(--glass-radius-pill) border border-border px-4 py-2 text-sm no-underline text-foreground transition hover:bg-muted"
          >
            {search.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
