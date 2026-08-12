import { Skeleton } from "@/components/ui/skeleton";
import { VehicleCardSkeleton } from "@/components/vehicle-card";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

// Most slugs are pre-rendered at build time (generateStaticParams) and
// served from the CDN, but any vehicle published after the last deploy
// renders on its first request with no fallback — a blank flash on exactly
// the page a shared WhatsApp/social link points at. Mirrors
// app/vehicles/[slug]/page.tsx: lg:grid-cols-[1.6fr_1fr] gallery+specs vs.
// sticky price/contact sidebar, and the "Similar vehicles" grid below.
export default function VehicleDetailLoading() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="grid gap-6 lg:gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <Skeleton className="aspect-4/3 w-full rounded-(--glass-radius-lg) sm:aspect-16/9" />

            <div className="glass-surface space-y-3 rounded-(--glass-radius-lg) p-4 lg:hidden">
              <Skeleton className="h-7 w-32" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 rounded-full" />
                <Skeleton className="h-10 rounded-full" />
              </div>
              <Skeleton className="h-10 w-full rounded-full" />
            </div>

            <div className="glass-surface rounded-(--glass-radius-lg) p-6">
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="mt-2 h-4 w-40" />
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>

          <aside className="hidden space-y-4 lg:block">
            <div className="glass-surface rounded-(--glass-radius-lg) p-6">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-40" />
              <div className="mt-6 space-y-2">
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-10 w-full rounded-full" />
                <Skeleton className="h-10 w-full rounded-full" />
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-10 sm:mt-12">
          <Skeleton className="h-7 w-48" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <VehicleCardSkeleton key={i} view="grid" />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
