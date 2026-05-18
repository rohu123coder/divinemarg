"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { salesNotifications } from "../lib/content";
import { usePrefersReducedMotion } from "../lib/motion";

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function SalesNotificationPopup() {
  const reduced = usePrefersReducedMotion();
  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(salesNotifications[0]);

  const showNext = useCallback(() => {
    setCurrent(pickRandom(salesNotifications));
    setVisible(true);
    window.setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    const firstTimer = window.setTimeout(showNext, 8000);
    return () => window.clearTimeout(firstTimer);
  }, [showNext]);

  useEffect(() => {
    if (!visible) {
      const delay = 12000 + Math.random() * 6000;
      const timer = window.setTimeout(showNext, delay);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [visible, showNext]);

  const avatarColor = current.name.charCodeAt(0) % 2 === 0 ? "#8B5CF6" : "#FF6B9D";

  return (
    <AnimatePresence>
      {visible ? (
        <motion.aside
          initial={reduced ? { opacity: 1 } : { opacity: 0, y: 40, x: -20 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, x: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="fixed bottom-20 left-3 z-50 w-[calc(100vw-1.5rem)] max-w-[360px] rounded-xl border border-gold-accent/30 bg-white p-4 shadow-xl md:bottom-6 md:left-6"
          role="status"
          aria-live="polite"
        >
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center text-slate-400 hover:text-slate-700"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
          <div className="flex gap-3 pr-6">
            <div className="relative shrink-0">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: avatarColor }}
              >
                {current.name.charAt(0)}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-success-green animate-online-pulse" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">
                <strong>{current.name}</strong> from {current.city} {current.action}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{current.time}</p>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
