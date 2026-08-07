import dynamic from "next/dynamic";
import { getTestimonials } from "@/lib/data/home";

// framer-motion (used by the carousel) is a genuinely heavy dependency, and
// this section is very often empty (no testimonials curated yet) — code
// split it into its own chunk so that chunk is only ever fetched on a page
// load that actually has testimonials to show, not on every homepage visit.
const TestimonialsCarousel = dynamic(() =>
  import("@/components/testimonials-carousel").then((mod) => mod.TestimonialsCarousel)
);

export async function Testimonials() {
  const testimonials = await getTestimonials();
  if (testimonials.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h2 className="text-center text-2xl font-semibold sm:text-3xl">What our users say</h2>
      <div className="mt-6">
        <TestimonialsCarousel testimonials={testimonials} />
      </div>
    </section>
  );
}
