"use client";

import { motion } from "framer-motion";

import { comparisonRows } from "../lib/content";
import { SectionReveal } from "./SectionReveal";
import { GoldCTA } from "./GoldCTA";

export function ComparisonTable() {
  return (
    <SectionReveal className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <h2 className="text-center font-heading text-3xl text-cream-white md:text-5xl">
          Marketplace vs Aapka Apna Platform
        </h2>
        <p className="mt-3 text-center font-sans text-lg text-cream-white/75">
          Numbers don&apos;t lie. Compare karke khud dekhiye.
        </p>

        <div className="mt-10 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[640px] border-collapse text-left font-sans text-sm md:text-base">
            <thead>
              <tr className="bg-cosmic-secondary">
                <th className="p-4 font-semibold text-cream-white">Feature</th>
                <th className="p-4 font-semibold text-cream-white/70">AstroTalk/Marketplace</th>
                <th className="p-4 font-semibold text-gold-accent">DivineMarg (Your Platform)</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map(([feature, marketplace, yours], i) => (
                <motion.tr
                  key={feature}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border-t border-white/10 even:bg-white/[0.02]"
                >
                  <td className="p-4 text-cream-white">{feature}</td>
                  <td className="p-4 text-cream-white/60">{marketplace}</td>
                  <td className="p-4 font-medium text-success-green">{yours}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 flex justify-center">
          <GoldCTA source="comparison-table">
            🔮 Book ₹99 Live Demo — Apna Comparison Khud Dekhiye
          </GoldCTA>
        </div>
      </div>
    </SectionReveal>
  );
}
