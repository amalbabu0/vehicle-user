"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Testimonial } from "@/lib/data/home";

export function TestimonialsCarousel({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const current = testimonials[index];

  const go = (delta: number) => setIndex((prev) => (prev + delta + testimonials.length) % testimonials.length);

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="glass-surface glass-specular min-h-48 overflow-hidden rounded-(--glass-radius-lg) p-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex justify-center gap-1 text-amber-500">
              {Array.from({ length: current.rating }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
            </div>
            <p className="mt-4 text-balance text-sm leading-6">&ldquo;{current.quote}&rdquo;</p>
            <p className="mt-4 text-sm font-semibold">{current.name}</p>
            <p className="text-xs text-muted-foreground">{current.location}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {testimonials.length > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button type="button" variant="outline" size="icon" onClick={() => go(-1)} aria-label="Previous testimonial">
            <ChevronLeft className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={() => go(1)} aria-label="Next testimonial">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
