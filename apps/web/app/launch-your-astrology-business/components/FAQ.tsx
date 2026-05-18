"use client";

import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { faqs } from "../lib/content";
import { SectionReveal } from "./SectionReveal";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <SectionReveal className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 md:px-8">
        <h2 className="text-center font-heading text-3xl text-cream-white md:text-5xl">
          Common Questions
        </h2>

        <div className="mt-10 space-y-3">
          {faqs.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-xl border border-white/10 bg-cosmic-secondary/50"
              >
                <button
                  type="button"
                  className="flex min-h-[52px] w-full items-center justify-between gap-4 px-5 py-4 text-left font-sans font-medium text-cream-white"
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                >
                  {faq.q}
                  <ChevronDown
                    className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    size={20}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="px-5 pb-4 font-sans text-sm leading-relaxed text-cream-white/80">
                        {faq.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </SectionReveal>
  );
}
