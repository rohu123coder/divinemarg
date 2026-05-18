"use client";

import { motion } from "framer-motion";

import { problems } from "../lib/content";
import { fadeUpVariants, staggerContainer, usePrefersReducedMotion } from "../lib/motion";
import { SectionReveal } from "./SectionReveal";

export function ProblemSection() {
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
          Kya Aap In Problems Se Pareshaan Hain?
        </motion.h2>
        <motion.p
          variants={reduced ? undefined : fadeUpVariants}
          className="mt-3 text-center font-sans text-lg text-cream-white/75"
        >
          Agar haan, toh ye page aapke liye hai.
        </motion.p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {problems.map((p) => (
            <motion.article
              key={p.title}
              variants={reduced ? undefined : fadeUpVariants}
              whileHover={reduced ? undefined : { y: -4 }}
              className="rounded-2xl border border-white/10 bg-card-highlight p-6 backdrop-blur-sm"
            >
              <span className="text-3xl">{p.icon}</span>
              <h3 className="mt-4 font-sans text-xl font-semibold text-cream-white">{p.title}</h3>
              <p className="mt-3 font-sans text-cream-white/75 leading-relaxed">{p.description}</p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </SectionReveal>
  );
}
