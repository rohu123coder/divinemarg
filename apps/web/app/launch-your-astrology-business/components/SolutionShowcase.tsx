"use client";

import { motion } from "framer-motion";

import { solutionBlocks } from "../lib/content";
import { fadeUpVariants, staggerContainer, usePrefersReducedMotion } from "../lib/motion";
import { SectionReveal } from "./SectionReveal";

export function SolutionShowcase() {
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
          Solution: Apna Astrology Business, Apni Shartein.
        </motion.h2>
        <motion.p
          variants={reduced ? undefined : fadeUpVariants}
          className="mx-auto mt-4 max-w-3xl text-center font-sans text-lg text-cream-white/80"
        >
          Hum aapke liye AstroTalk jaisa complete platform 30 din mein ready karke dete hain. Aap
          commission nahi dete. Customers aapke hain. Brand aapka hai. Aap boss hain.
        </motion.p>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {solutionBlocks.map((block) => (
            <motion.div
              key={block.title}
              variants={reduced ? undefined : fadeUpVariants}
              className="rounded-2xl border border-violet-electric/30 bg-cosmic-secondary/60 p-8 text-center"
            >
              <span className="text-4xl">{block.icon}</span>
              <h3 className="mt-4 font-sans text-xl font-bold text-gold-accent">{block.title}</h3>
              <p className="mt-3 font-sans text-cream-white/80">{block.subtitle}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </SectionReveal>
  );
}
