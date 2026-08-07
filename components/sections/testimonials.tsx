import { getTestimonials } from "@/lib/data/home";
import { TestimonialsCarousel } from "@/components/testimonials-carousel";

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
