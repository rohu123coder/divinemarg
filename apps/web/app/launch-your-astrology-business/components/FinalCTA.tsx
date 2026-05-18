"use client";

import { motion } from "framer-motion";

import { SectionReveal } from "./SectionReveal";
import { GoldCTA } from "./GoldCTA";
import { usePrefersReducedMotion } from "../lib/motion";

export function FinalCTA() {
  const reduced = usePrefersReducedMotion();

  return (
    <SectionReveal className="relative overflow-hidden py-20 md:py-28">
      <div className="absolute inset-0 bg-gradient-to-b from-cosmic-deep via-cosmic-secondary to-[#0A0418]" />
      {!reduced ? (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[...Array(20)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-gold-accent/80"
              style={{ left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%` }}
              animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.5, 1] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      ) : null}

      <div className="relative mx-auto max-w-4xl px-4 text-center md:px-8">
        <h2 className="font-heading text-4xl text-cream-white md:text-6xl">
          Aapka Astrology Business — 30 Din Door.
        </h2>
        <p className="mt-6 font-sans text-lg text-cream-white/85 md:text-xl">
          Decision aapka hai: agle 6 mahine marketplace ko 35% dete rahein, ya agle 30 din mein apna
          platform launch karein aur 100% earnings apne paas rakhein.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4">
          <GoldCTA source="final-cta">🔮 Book ₹99 Live Demo — Right Now</GoldCTA>
          <p className="text-sm text-cream-white/70">Limited slots | Refundable | Founder-led demo</p>
          <p className="font-sans text-gold-accent">
            ⏰ Next 3 demo slots: Today 4 PM | Tomorrow 11 AM | Tomorrow 6 PM
          </p>
        </div>
      </div>
    </SectionReveal>
  );
}
