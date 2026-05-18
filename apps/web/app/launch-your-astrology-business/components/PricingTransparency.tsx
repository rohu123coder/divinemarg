"use client";

import { motion } from "framer-motion";

import { pricingColumns } from "../lib/content";
import { fadeUpVariants, staggerContainer, usePrefersReducedMotion } from "../lib/motion";
import { SectionReveal } from "./SectionReveal";
import { GoldCTA } from "./GoldCTA";

export function PricingTransparency() {
  const reduced = usePrefersReducedMotion();

  return (
    <SectionReveal className="py-16 md:py-24">
      <motion.div
        className="mx-auto max-w-7xl px-4 md:px-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={reduced ? undefined : staggerContainer}
      >
        <motion.h2
          variants={reduced ? undefined : fadeUpVariants}
          className="text-center font-heading text-3xl text-cream-white md:text-5xl"
        >
          ₹99 Demo Mein Kya Milta Hai?
        </motion.h2>
        <motion.p
          variants={reduced ? undefined : fadeUpVariants}
          className="mx-auto mt-4 max-w-3xl text-center font-sans text-lg text-cream-white/80"
        >
          Hum free demo nahi karte. Kyun? Kyunki free demo mein time-wasters aate hain. ₹99 lete
          hain taaki sirf serious entrepreneurs hi book karein. Aur ye amount 100% adjustable hai
          aapke final package mein.
        </motion.p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pricingColumns.map((col) => (
            <motion.div
              key={col.title}
              variants={reduced ? undefined : fadeUpVariants}
              className="rounded-2xl border border-gold-accent/25 bg-cosmic-secondary/60 p-6"
            >
              <h3 className="font-sans text-xl font-bold text-gold-accent">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.items.map((item) => (
                  <li key={item} className="flex gap-2 font-sans text-sm text-cream-white/85">
                    <span className="text-success-green">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-4">
          <GoldCTA source="pricing">🔮 Book Your ₹99 Demo Slot</GoldCTA>
          <p className="text-center text-sm text-cream-white/70 md:text-base">
            ⚡ Only 12 slots available this week | 🔒 Secure Razorpay payment | ✅ Instant confirmation
          </p>
        </div>
      </motion.div>
    </SectionReveal>
  );
}
