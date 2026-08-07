import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { FeaturedVehicles } from "@/components/sections/featured-vehicles";
import { LatestVehicles } from "@/components/sections/latest-vehicles";
import { BrowseByCategory } from "@/components/sections/browse-by-category";
import { BrowseByBrand } from "@/components/sections/browse-by-brand";
import { BrowseByDistrict } from "@/components/sections/browse-by-district";
import { WhyUs } from "@/components/sections/why-us";
import { PopularSearches } from "@/components/sections/popular-searches";
import { Testimonials } from "@/components/sections/testimonials";
import { Faq } from "@/components/sections/faq";
import { VehicleSectionSkeleton } from "@/components/sections/section-skeleton";

interface HomePageProps {
  searchParams: Promise<{
    code?: string;
    next?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  if (params.code) {
    const nextPath = params.next ? `&next=${encodeURIComponent(params.next)}` : "";
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}${nextPath}`);
  }

  return (
    <>
      <Navbar />
      <main>
        <Hero />

        <Suspense fallback={<VehicleSectionSkeleton />}>
          <FeaturedVehicles />
        </Suspense>

        <Suspense fallback={null}>
          <BrowseByCategory />
        </Suspense>

        <Suspense fallback={null}>
          <BrowseByBrand />
        </Suspense>

        <Suspense fallback={null}>
          <BrowseByDistrict />
        </Suspense>

        <WhyUs />

        <Suspense fallback={<VehicleSectionSkeleton />}>
          <LatestVehicles />
        </Suspense>

        <Suspense fallback={null}>
          <PopularSearches />
        </Suspense>

        <Suspense fallback={null}>
          <Testimonials />
        </Suspense>

        <Faq />
      </main>
      <Footer />
    </>
  );
}
