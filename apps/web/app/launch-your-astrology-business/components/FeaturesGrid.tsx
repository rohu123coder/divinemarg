"use client";

import { motion } from "framer-motion";

import { features } from "../lib/content";
import { fadeUpVariants, staggerContainer, usePrefersReducedMotion } from "../lib/motion";
import { SectionReveal } from "./SectionReveal";

export function FeaturesGrid() {
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
          Sab Kuch Jo Aapko Chahiye — Ready Hai
        </motion.h2>
        <motion.p
          variants={reduced ? undefined : fadeUpVariants}
          className="mt-4 text-center font-sans text-lg text-cream-white/75"
        >
          12 powerful systems, 1 complete platform. Bina coding, bina developer, bina headache.
        </motion.p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {features.map((f) => (
            <motion.article
              key={f.title}
              variants={reduced ? undefined : fadeUpVariants}
              whileHover={
                reduced
                  ? undefined
                  : {
                      rotateX: 4,
                      rotateY: -4,
                      scale: 1.02,
                      boxShadow: "0 0 24px rgba(139, 92, 246, 0.35)",
                    }
              }
              style={{ transformPerspective: 800 }}
              className="rounded-2xl border border-white/10 bg-card-highlight p-5 transition-colors hover:border-violet-electric/50"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-sans text-lg font-semibold text-cream-white">{f.title}</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-cream-white/70">{f.desc}</p>
            </motion.article>
          ))}
        </div>
      </motion.div>
    </SectionReveal>
  );
}
