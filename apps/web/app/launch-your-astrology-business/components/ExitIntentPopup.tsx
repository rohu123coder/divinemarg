"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePrefersReducedMotion } from "../lib/motion";
import { GoldCTA } from "./GoldCTA";

const SESSION_KEY = "dm_exit_intent_shown";

export function ExitIntentPopup() {
  const reduced = usePrefersReducedMotion();
  const [open, setOpen] = useState(false);
  const canShowRef = useRef(false);
  const maxScrollRef = useRef(0);
  const lastScrollRef = useRef(0);

  const tryShow = useCallback(() => {
    if (!canShowRef.current) return;
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(true);
    // trackEvent('exit_intent_shown');
  }, []);

  useEffect(() => {
    const readyTimer = window.setTimeout(() => {
      canShowRef.current = true;
    }, 10000);

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && e.movementY < 0) {
        tryShow();
      }
    };

    const onScroll = () => {
      const y = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      maxScrollRef.current = Math.max(maxScrollRef.current, y);
      if (
        maxScrollRef.current > docHeight * 0.5 &&
        y < lastScrollRef.current - 80
      ) {
        tryShow();
      }
      lastScrollRef.current = y;
    };

    window.addEventListener("mouseout", onMouseLeave);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.clearTimeout(readyTimer);
      window.removeEventListener("mouseout", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [tryShow]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Close popup"
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="exit-intent-title"
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-2 border-gold-accent/50 bg-cosmic-deep p-6 shadow-2xl md:p-8"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-cream-white/50 hover:text-cream-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <motion.div
              className="relative mx-auto h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-gold-accent/40"
              animate={reduced ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/landing-assets/rohit-founder.jpg"
                alt="Rohit Jha"
                fill
                className="object-cover"
                sizes="120px"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-cosmic-secondary text-3xl">
                👤
              </div>
            </motion.div>

            <h2
              id="exit-intent-title"
              className="mt-6 text-center font-heading text-2xl text-cream-white md:text-3xl"
            >
              Ruko! Ek Last Cheez...
            </h2>
            <p className="mt-4 text-center font-sans text-cream-white/85 leading-relaxed">
              Main Rohit hoon — founder of DivineMarg. Agar aap genuinely apna astrology business
              start karna chahte hain, toh main personally aapke saath 30 minutes spend karunga.
            </p>
            <p className="mt-3 text-center font-sans font-semibold text-gold-accent">
              Sirf ₹99 mein — 100% refundable agar value nahi mila.
            </p>

            <ul className="mt-6 space-y-2 font-sans text-sm text-cream-white/85">
              <li>• Personal demo with founder (not sales person)</li>
              <li>• Custom strategy for your specific situation</li>
              <li>• Honest pricing — no hidden costs</li>
              <li>• Refund guarantee</li>
            </ul>

            <div className="mt-8 flex flex-col items-center gap-3">
              <GoldCTA
                source="exit-intent"
                className="w-full max-w-sm"
                onBeforeOpen={() => setOpen(false)}
              >
                🔮 Book ₹99 Demo with Rohit
              </GoldCTA>
              <p className="text-center text-xs text-cream-white/50">
                Closing window? No problem. Save this page link to come back later.
              </p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
