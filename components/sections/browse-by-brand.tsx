import Image from "next/image";
import Link from "next/link";
import { getPopularCarBrands, getPopularBikeBrands } from "@/lib/data/home";
import type { BrandWithCount } from "@/lib/data/home";

function BrandRow({ title, brands }: { title: string; brands: BrandWithCount[] }) {
  if (brands.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-10">
        {brands.map((brand) => (
          <Link
            key={brand.id}
            href={`/vehicles?brand=${brand.slug}`}
            className="glass-surface flex flex-col items-center gap-2 rounded-(--glass-radius) p-3 text-center no-underline text-foreground transition hover:-translate-y-0.5 hover:shadow-md"
          >
            {brand.logoUrl ? (
              <div className="relative size-10">
                <Image src={brand.logoUrl} alt={brand.name} fill sizes="40px" className="object-contain" />
              </div>
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {brand.name.charAt(0)}
              </div>
            )}
            <span className="line-clamp-1 text-xs font-medium">{brand.name}</span>
            <span className="text-[10px] text-muted-foreground">{brand.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function BrowseByBrand() {
  const [carBrands, bikeBrands] = await Promise.all([getPopularCarBrands(), getPopularBikeBrands()]);
  if (carBrands.length === 0 && bikeBrands.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-semibold sm:text-3xl">Browse by brand</h2>
      <div className="mt-6 space-y-8">
        <BrandRow title="Cars" brands={carBrands} />
        <BrandRow title="Bikes" brands={bikeBrands} />
      </div>
    </section>
  );
}
