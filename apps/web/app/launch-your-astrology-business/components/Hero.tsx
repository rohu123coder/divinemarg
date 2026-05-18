"use client";

import { motion } from "framer-motion";
import { GoldCTA } from "./GoldCTA";
import { usePrefersReducedMotion } from "../lib/motion";

const headlineWords = [
  "Apna",
  "Khud",
  "Ka",
  "Astrology",
  "Business",
  "Launch",
  "Karein",
  "—",
  "Bilkul",
  "AstroTalk",
  "Jaisa,",
  "30",
  "Din",
  "Mein.",
];

export function Hero() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-20">
      <motion.div
        className="pointer-events-none absolute inset-0 bg-hero-radial"
        style={{ y: reduced ? 0 : undefined }}
        animate={reduced ? undefined : { scale: [1, 1.03, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      >
        {[...Array(12)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-gold-accent"
            style={{
              left: `${8 + (i * 7) % 88}%`,
              top: `${10 + (i * 11) % 75}%`,
            }}
            animate={
              reduced
                ? undefined
                : {
                    opacity: [0.2, 1, 0.2],
                    y: [0, -12, 0],
                  }
            }
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 md:grid-cols-2 md:px-8">
        <div>
          <p className="mb-4 font-sans text-sm font-medium uppercase tracking-wider text-violet-light md:text-base">
            India&apos;s #1 Done-For-You Astrology Business Platform
          </p>

          <h1 className="font-heading text-3xl leading-tight text-cream-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
            {headlineWords.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                className={`mr-2 inline-block ${
                  word === "Business"
                    ? "bg-gradient-to-r from-gold-accent via-soft-gold to-mystic-pink bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,215,0,0.45)]"
                    : ""
                }`}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.45 }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="mt-6 max-w-xl font-sans text-base leading-relaxed text-cream-white/85 md:text-lg"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.1, duration: 0.6 }}
          >
            Website + Mobile App + Astrologer Panel + Payment Gateway + WhatsApp Automation + Admin
            System — sab kuch ready. Aap sirf consultations dijiye, hum poora business setup karke
            denge. Marketplace ki 30% commission khatam.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col items-start gap-4"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.4, duration: 0.5 }}
          >
            <GoldCTA source="hero-primary">🔮 Book ₹99 Live Demo</GoldCTA>
            <p className="text-sm text-cream-white/70 md:text-base">
              ⚡ Limited slots this week | ✅ 100% refundable | 🎁 Free strategy session included
            </p>
          </motion.div>

          <p className="mt-8 text-sm text-cream-white/75 md:text-base">
            🌟 Trusted by 50+ astrologers across India | ⭐ 4.9/5 rating | 🚀 Platforms launched in
            30 days
          </p>
        </div>

        <motion.div
          className="relative mx-auto w-full max-w-md"
          initial={reduced ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2, duration: 0.7 }}
        >
          <div className="absolute -inset-6 rounded-3xl bg-gradient-to-br from-violet-electric/30 to-mystic-pink/20 blur-3xl" />
          <div className="relative space-y-4">
            <motion.div
              className="relative overflow-hidden rounded-2xl border border-gold-accent/30 bg-cosmic-secondary/80 p-2 shadow-2xl"
              animate={reduced ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="flex aspect-[9/16] items-center justify-center rounded-xl bg-gradient-to-b from-cosmic-secondary to-cosmic-deep text-center text-cream-white/60">
                <div>
                  <p className="text-4xl">📱</p>
                  <p className="mt-2 font-sans text-sm">Your Branded App</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="absolute -right-2 top-8 w-[85%] overflow-hidden rounded-xl border border-white/10 bg-cosmic-deep/90 p-2 shadow-xl md:-right-6"
              animate={reduced ? undefined : { y: [0, 6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <motion.div className="flex aspect-video items-center justify-center rounded-lg bg-cosmic-secondary text-cream-white/60">
                <div>
                  <p className="text-3xl">🌐</p>
                  <p className="mt-1 font-sans text-xs">Premium Website</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
