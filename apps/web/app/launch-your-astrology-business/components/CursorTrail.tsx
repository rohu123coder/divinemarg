"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { useIsCoarsePointer, usePrefersReducedMotion } from "../lib/motion";

type Star = {
  id: number;
  x: number;
  y: number;
  drift: number;
};

export function CursorTrail() {
  const coarse = useIsCoarsePointer();
  const reduced = usePrefersReducedMotion();
  const [stars, setStars] = useState<Star[]>([]);
  const idRef = useRef(0);

  const spawnStar = useCallback((x: number, y: number) => {
    const id = idRef.current++;
    const drift = (Math.random() - 0.5) * 40;
    setStars((prev) => [...prev.slice(-11), { id, x, y, drift }]);
    window.setTimeout(() => {
      setStars((prev) => prev.filter((s) => s.id !== id));
    }, 800);
  }, []);

  useEffect(() => {
    if (coarse || reduced) return;

    const onMove = (e: MouseEvent) => {
      spawnStar(e.clientX, e.clientY);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [coarse, reduced, spawnStar]);

  if (coarse || reduced) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[60]"
      aria-hidden
    >
      <AnimatePresence>
        {stars.map((star) => (
          <motion.span
            key={star.id}
            className="absolute text-sm text-gold-accent"
            style={{ left: star.x, top: star.y }}
            initial={{ opacity: 0, scale: 0.4, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.6], y: 24, x: star.drift }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            ✦
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
