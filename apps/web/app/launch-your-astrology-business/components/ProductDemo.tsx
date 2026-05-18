"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { demoImages } from "../lib/content";
import { SectionReveal } from "./SectionReveal";

export function ProductDemo() {
  const [index, setIndex] = useState(0);
  const current = demoImages[index];

  const prev = () => setIndex((i) => (i === 0 ? demoImages.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === demoImages.length - 1 ? 0 : i + 1));

  return (
    <SectionReveal className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="text-center font-heading text-3xl text-cream-white md:text-5xl">
          Dekho — Asli Platform, Asli Demo
        </h2>
        <p className="mt-3 text-center font-sans text-lg text-cream-white/75">
          Ye screenshots aapke demo mein live dikhayenge.
        </p>

        <div className="relative mx-auto mt-10 max-w-4xl">
          <motion.div
            key={current.src}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            className="relative aspect-video overflow-hidden rounded-2xl border border-gold-accent/30 bg-cosmic-secondary"
          >
            <Image
              src={current.src}
              alt={current.alt}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 896px"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-cosmic-secondary/90 text-cream-white/70">
              <div className="text-center">
                <p className="text-4xl">🖼️</p>
                <p className="mt-2 font-sans">{current.alt}</p>
                <p className="mt-1 text-xs text-cream-white/50">{current.src}</p>
              </div>
            </div>
          </motion.div>

          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-cosmic-deep/80 text-cream-white"
            aria-label="Previous slide"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-cosmic-deep/80 text-cream-white"
            aria-label="Next slide"
          >
            <ChevronRight />
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {demoImages.map((img, i) => (
            <button
              key={img.src}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-gold-accent" : "w-2 bg-white/30"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </SectionReveal>
  );
}
