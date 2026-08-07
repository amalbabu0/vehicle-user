"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Car, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroSearchForm } from "@/components/hero-search-form";
import type { DistrictOption } from "@/lib/data/locations";
import type { CategoryWithCount } from "@/lib/data/home";

export function HeroContent({ districts, categories }: { districts: DistrictOption[]; categories: CategoryWithCount[] }) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--primary),transparent_88%),transparent_55%),radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--primary),transparent_92%),transparent_50%)]"
      />
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
        >
          Kerala&apos;s marketplace for used cars &amp; bikes
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg"
        >
          Buy, sell, or lease vehicles directly from owners across Kerala — verified listings, no hidden charges.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 w-full"
        >
          <HeroSearchForm districts={districts} categories={categories} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/vehicles" className="no-underline">
            <Button size="lg" variant="outline" className="gap-2">
              <Car className="size-4" /> Browse Vehicles
            </Button>
          </Link>
          <Link href="/sell" className="no-underline">
            <Button size="lg" className="gap-2">
              <Tag className="size-4" /> Sell Your Vehicle
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
