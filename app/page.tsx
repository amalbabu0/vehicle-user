import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { LatestVehicles } from "@/components/sections/latest-vehicles";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Testimonials } from "@/components/sections/testimonials";
import { Faq } from "@/components/sections/faq";
import { VehicleSectionSkeleton } from "@/components/sections/section-skeleton";
import { TestimonialsSkeleton } from "@/components/sections/testimonials-skeleton";
import { FaqJsonLd } from "@/components/seo/faq-jsonld";

export const revalidate = 120;

// A ?code=... landing on "/" (some Supabase OAuth redirect configs do this
// instead of hitting /auth/callback directly) is now caught in proxy.ts,
// not here — this page no longer reads searchParams at all, which is what
// lets it be a fully static/cacheable route. See PERFORMANCE.md.
export default function HomePage() {
  return (
    <>
      <FaqJsonLd />
      <Navbar />
      <main>
        <Hero />

        <Suspense fallback={<VehicleSectionSkeleton />}>
          <LatestVehicles />
        </Suspense>

        <HowItWorks />

        <Suspense fallback={<TestimonialsSkeleton />}>
          <Testimonials />
        </Suspense>

        <Faq />
      </main>
      <Footer />
    </>
  );
}
