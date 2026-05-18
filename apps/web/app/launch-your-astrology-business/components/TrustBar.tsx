"use client";

import { motion } from "framer-motion";

import { trustStats } from "../lib/content";
import { usePrefersReducedMotion } from "../lib/motion";

export function TrustBar() {
  const reduced = usePrefersReducedMotion();
  const items = [...trustStats, ...trustStats];

  return (
    <section className="border-y border-white/10 bg-cosmic-secondary/50 py-4">
      <div className="overflow-hidden">
        <motion.div
          className="flex w-max gap-8 whitespace-nowrap px-4"
          animate={reduced ? undefined : { x: ["0%", "-50%"] }}
          transition={reduced ? undefined : { duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {items.map((stat, i) => (
            <span
              key={`${stat}-${i}`}
              className="flex items-center gap-2 font-sans text-sm font-medium text-cream-white/90 md:text-base"
            >
              <span className="text-gold-accent">✦</span>
              {stat}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
