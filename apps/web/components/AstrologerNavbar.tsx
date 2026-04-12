"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/store";

export function AstrologerNavbar() {
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-violet-200/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/astrologer/dashboard"
          className="shrink-0 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-500 bg-clip-text text-lg font-bold text-transparent sm:text-xl"
        >
          DivineMarg · Astrologer
        </Link>

        <nav className="hidden items-center gap-5 md:flex">
          <Link
            href="/astrologer/dashboard"
            className="text-sm font-medium text-slate-700 hover:text-purple-600"
          >
            Dashboard
          </Link>
          <Link
            href="/astrologer/profile"
            className="text-sm font-medium text-slate-700 hover:text-purple-600"
          >
            Profile
          </Link>
          <Link
            href="/astrologer/earnings"
            className="text-sm font-medium text-slate-700 hover:text-purple-600"
          >
            Earnings
          </Link>
          {mounted ? (
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          ) : null}
        </nav>

        <button
          type="button"
          className="md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((o) => !o)}
        >
          <svg
            className="h-7 w-7 text-slate-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {open ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              href="/astrologer/dashboard"
              className="rounded-lg px-3 py-2 text-slate-800 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/astrologer/profile"
              className="rounded-lg px-3 py-2 text-slate-800 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/astrologer/earnings"
              className="rounded-lg px-3 py-2 text-slate-800 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              Earnings
            </Link>
            <p className="truncate px-3 text-xs text-slate-500">
              {user?.name ?? ""}
            </p>
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
              onClick={() => {
                setOpen(false);
                logout();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
