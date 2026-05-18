"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

import { GoldCTA } from "./GoldCTA";

export function StickyMobileCTA() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-gold-accent/20 bg-cosmic-deep/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.4)] backdrop-blur-md md:hidden"
        >
          <GoldCTA source="sticky-mobile" className="w-full">
            🔮 Book ₹99 Live Demo
          </GoldCTA>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
