"use client";

import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import { getTenant } from "@/lib/tenants";

import { GoldCTA } from "./GoldCTA";

export function Navbar() {
  const tenant = getTenant();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-cosmic-deep/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="font-heading text-xl font-bold text-gold-accent md:text-2xl">
          {tenant.logo.text}
        </Link>

        <div className="hidden md:block">
          <GoldCTA source="navbar" size="md">
            Book ₹99 Live Demo
          </GoldCTA>
        </div>

        <button
          type="button"
          className="flex h-12 w-12 items-center justify-center rounded-lg text-cream-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-cosmic-secondary/95 md:hidden"
          >
            <div className="flex flex-col gap-4 px-4 py-6">
              <GoldCTA source="navbar-mobile" className="w-full">
                Book ₹99 Live Demo
              </GoldCTA>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
