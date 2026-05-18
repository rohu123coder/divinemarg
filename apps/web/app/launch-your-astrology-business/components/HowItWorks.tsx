"use client";

import { motion } from "framer-motion";

import { steps } from "../lib/content";
import { fadeUpVariants, staggerContainer, usePrefersReducedMotion } from "../lib/motion";
import { SectionReveal } from "./SectionReveal";

export function HowItWorks() {
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
          4 Simple Steps — Aapka Business Live
        </motion.h2>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              variants={reduced ? undefined : fadeUpVariants}
              className="relative rounded-2xl border border-white/10 bg-cosmic-secondary/50 p-6"
            >
              <span className="absolute -top-3 left-6 rounded-full bg-gold-accent px-3 py-0.5 text-xs font-bold text-cosmic-deep">
                {i + 1}
              </span>
              <span className="text-3xl">{step.icon}</span>
              <h3 className="mt-4 font-sans text-lg font-semibold text-cream-white">{step.title}</h3>
              <p className="mt-2 font-sans text-sm text-cream-white/75 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SectionReveal>
  );
}
