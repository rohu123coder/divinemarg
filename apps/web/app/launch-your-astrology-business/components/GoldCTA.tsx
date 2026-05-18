"use client";

import { motion } from "framer-motion";
import { useDemoBooking } from "../lib/DemoBookingContext";
import { usePrefersReducedMotion } from "../lib/motion";

type GoldCTAProps = {
  children: React.ReactNode;
  className?: string;
  source?: string;
  size?: "md" | "lg";
  onBeforeOpen?: () => void;
};

export function GoldCTA({
  children,
  className = "",
  source = "landing-cta",
  size = "lg",
  onBeforeOpen,
}: GoldCTAProps) {
  const { openCheckout } = useDemoBooking();
  const reduced = usePrefersReducedMotion();

  const sizeClass =
    size === "lg"
      ? "min-h-[52px] px-8 py-4 text-base md:text-lg"
      : "min-h-[48px] px-6 py-3 text-sm md:text-base";

  return (
    <motion.button
      type="button"
      onClick={() => {
        onBeforeOpen?.();
        openCheckout(source);
      }}
      className={`relative overflow-hidden rounded-full bg-cta-gold font-semibold text-cosmic-deep shadow-gold-glow transition ${sizeClass} ${className}`}
      whileHover={reduced ? undefined : { scale: 1.05, filter: "brightness(1.08)" }}
      whileTap={reduced ? undefined : { scale: 0.98 }}
      animate={
        reduced
          ? undefined
          : {
              boxShadow: [
                "0 0 20px rgba(255, 215, 0, 0.35)",
                "0 0 36px rgba(255, 107, 157, 0.45)",
                "0 0 20px rgba(255, 215, 0, 0.35)",
              ],
            }
      }
      transition={reduced ? undefined : { duration: 2.5, repeat: Infinity }}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
