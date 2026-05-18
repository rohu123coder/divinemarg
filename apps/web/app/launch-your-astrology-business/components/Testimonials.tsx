"use client";

import { motion } from "framer-motion";

import { testimonials } from "../lib/content";
import { usePrefersReducedMotion } from "../lib/motion";
import { SectionReveal } from "./SectionReveal";

const colors = ["#8B5CF6", "#FF6B9D", "#FFD700", "#10B981", "#F4C430"];

export function Testimonials() {
  const reduced = usePrefersReducedMotion();
  const doubled = [...testimonials, ...testimonials];

  return (
    <SectionReveal className="overflow-hidden py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="text-center font-heading text-3xl text-cream-white md:text-5xl">
          Asli Astrologers, Asli Results
        </h2>

        <div className="mt-12 overflow-hidden">
          <motion.div
            className="flex w-max gap-6"
            animate={reduced ? undefined : { x: ["0%", "-50%"] }}
            transition={reduced ? undefined : { duration: 40, repeat: Infinity, ease: "linear" }}
          >
            {doubled.map((t, i) => (
              <article
                key={`${t.name}-${i}`}
                className="w-[min(100vw-2rem,340px)] shrink-0 rounded-2xl border border-white/10 bg-card-highlight p-6 md:w-[360px]"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full font-bold text-cosmic-deep"
                    style={{ backgroundColor: colors[i % colors.length] }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-sans font-semibold text-cream-white">{t.name}</p>
                    <p className="font-sans text-sm text-cream-white/60">{t.location}</p>
                  </div>
                </div>
                <p className="mt-4 font-sans text-sm leading-relaxed text-cream-white/85">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </article>
            ))}
          </motion.div>
        </div>
      </div>
    </SectionReveal>
  );
}
