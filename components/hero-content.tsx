import Link from "next/link";
import Image from "next/image";
import { Car, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearchForm } from "@/components/hero-search-form";
import type { DistrictOption } from "@/lib/data/locations";
import type { CategoryWithCount } from "@/lib/data/home";

// Plain CSS entrance animation (tw-animate-css, already a dependency used
// throughout the shadcn primitives) instead of framer-motion — this section
// is above-the-fold and always rendered, so pulling in a ~50KB animation
// library just for a one-time fade/slide-up isn't worth it. No "use client"
// needed either now that there's no hook/animation state.
export function HeroContent({ districts, categories }: { districts: DistrictOption[]; categories: CategoryWithCount[] }) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--primary),transparent_88%),transparent_55%),radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--primary),transparent_92%),transparent_50%)]"
      />

      {/* Decorative brand mark filling the empty space beside the search
          card on wide screens — hidden below lg where the content column
          already fills the width. Two images (not one + CSS invert) so it
          matches the exact light/dark artwork used everywhere else (see
          navbar-client.tsx's identical dark:hidden/dark:block pairing). */}
      <Image
        src="/branding/logo-light.webp"
        alt=""
        aria-hidden
        width={320}
        height={320}
        className="pointer-events-none absolute top-1/2 right-[calc(1.5rem+5cm)] hidden size-64 translate-y-[calc(-50%+5cm)] object-contain opacity-90 lg:block dark:hidden xl:right-[calc(4rem+5cm)] xl:size-80"
        priority
      />
      <Image
        src="/branding/logo-dark.webp"
        alt=""
        aria-hidden
        width={320}
        height={320}
        className="pointer-events-none absolute top-1/2 right-[calc(1.5rem+5cm)] hidden size-64 translate-y-[calc(-50%+5cm)] object-contain opacity-90 lg:dark:block xl:right-[calc(4rem+5cm)] xl:size-80"
        priority
      />

      <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
        <h1 className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Kerala&apos;s vehicle leasing platform — cars, bikes &amp; more
        </h1>
        <p className="animate-in fade-in slide-in-from-bottom-4 delay-100 duration-500 mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg fill-mode-both">
          Lease vehicles of every kind directly from owners across Kerala — verified listings, no hidden charges.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-4 delay-200 duration-500 fill-mode-both mt-8 w-full">
          <HeroSearchForm districts={districts} categories={categories} />
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-4 delay-300 duration-500 fill-mode-both mt-6 flex w-full max-w-md gap-3 sm:w-auto sm:max-w-none">
          <Link href="/vehicles" className="flex-1 no-underline sm:flex-none">
            <Button size="lg" variant="outline" className="w-full gap-2">
              <Car className="size-4" /> Browse Vehicles
            </Button>
          </Link>
          <Link href="/sell" className="flex-1 no-underline sm:flex-none">
            <Button size="lg" className="w-full gap-2">
              <Tag className="size-4" /> List Your Vehicle
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
