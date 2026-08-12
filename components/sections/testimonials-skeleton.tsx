import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors Testimonials → TestimonialsCarousel: centered heading, then a
 * single glass card (same min-h-48) with a star row, 2 quote lines, a name
 * line, and a location line. Previously this section's Suspense fallback
 * was `null` — no reserved height, so on the (common) case where
 * testimonials do exist, the whole section popped in and pushed the FAQ
 * section down. When there genuinely are none, this collapses away once
 * getTestimonials() resolves empty, same as before — that part is
 * unavoidable since the section's real height is unknown until then. */
export function TestimonialsSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="mx-auto h-8 w-56 sm:h-9" />
      <div className="mx-auto mt-6 max-w-2xl">
        <div className="glass-surface min-h-48 rounded-(--glass-radius-lg) p-8 text-center">
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="size-4 rounded-full" />
            ))}
          </div>
          <Skeleton className="mx-auto mt-4 h-4 w-full max-w-md" />
          <Skeleton className="mx-auto mt-2 h-4 w-2/3 max-w-sm" />
          <Skeleton className="mx-auto mt-4 h-4 w-28" />
          <Skeleton className="mx-auto mt-2 h-3 w-20" />
        </div>
      </div>
    </section>
  );
}
