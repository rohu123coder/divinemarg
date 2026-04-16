"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/lib/store";

function formatMoney(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function Navbar() {
  const router = useRouter();
  const { user, isLoggedIn, logout, isWalletRefreshing } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const topLinks = [
    { label: "Rashifal", href: "/horoscope" },
    { label: "Kundli", href: "/kundli" },
    { label: "Kundli Matching", href: "/kundli/match" },
    { label: "Horoscope 2026", href: "/horoscope?year=2026" },
    { label: "Today Horoscope", href: "/horoscope?period=today" },
    { label: "Panchang", href: "/panchang" },
  ];

  const mainLinks = [
    { label: "Free Kundli", href: "/kundli" },
    { label: "Horoscope", href: "/horoscope" },
    { label: "Astrology", href: "/astrology" },
    { label: "2026", href: "/horoscope?year=2026" },
    { label: "Remedies", href: "/remedies" },
    { label: "Free Reports", href: "/reports" },
    { label: "Panchang", href: "/panchang" },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  const balance = user?.wallet_balance ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b border-violet-200/70 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="hidden border-b border-violet-100 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-sm sm:px-6">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-slate-600">
            {topLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-violet-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span className="font-medium text-violet-600">Trusted Astro Guidance</span>
        </div>
      </div>

      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
        <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-xl font-extrabold text-transparent sm:text-2xl">
            ✨ DivineMarg
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {mainLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-slate-700 transition hover:text-violet-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!mounted ? (
            <div className="h-9 w-44 animate-pulse rounded-lg bg-slate-100" />
          ) : isLoggedIn ? (
            <>
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:text-sm">
                {isWalletRefreshing ? "Updating..." : formatMoney(balance)}
              </span>
              <Link
                href="/astrologers"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                Chat with Astrologer
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
              >
                Dashboard
              </Link>
              <button
                type="button"
                className="rounded-full px-2 py-2 text-sm font-semibold text-slate-600 transition hover:text-red-600"
                onClick={() => logout()}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/astrologers"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                Chat with Astrologer
              </Link>
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-violet-50"
                onClick={(event) => {
                  event.preventDefault();
                  router.push("/login");
                }}
              >
                Sign In
              </Link>
              <Link
                href="/login?tab=register"
                className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                onClick={(event) => {
                  event.preventDefault();
                  router.push("/login?tab=register");
                }}
              >
                Sign Up
              </Link>
              <Link
                href="/astrologer/login"
                className="text-sm font-semibold text-slate-600 transition hover:text-violet-700"
              >
                Astrologer Login
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {!mounted ? null : isLoggedIn ? (
            <span className="max-w-[6rem] truncate rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              {isWalletRefreshing ? "Updating..." : formatMoney(balance)}
            </span>
          ) : null}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-violet-200 text-violet-700"
            aria-label="Open menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className="sr-only">Menu</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {menuOpen ? (
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
      </div>

      {menuOpen && mounted ? (
        <div className="border-t border-violet-100 bg-white px-4 py-4 md:hidden">
          <div>
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-violet-500">
              Quick links
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {topLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg border border-violet-100 px-3 py-2 text-sm text-slate-700 transition hover:bg-violet-50"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-violet-500">
              Services
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {mainLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-violet-50"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-violet-100 pt-4">
            <Link
              href="/astrologers"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
              onClick={() => setMenuOpen(false)}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Chat with Astrologer
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className="block rounded-full border border-violet-200 px-4 py-2.5 text-center text-sm font-semibold text-violet-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  className="block w-full rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="rounded-full border border-violet-200 px-4 py-2.5 text-center text-sm font-semibold text-violet-700"
                    onClick={(event) => {
                      event.preventDefault();
                      setMenuOpen(false);
                      router.push("/login");
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/login?tab=register"
                    className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white"
                    onClick={(event) => {
                      event.preventDefault();
                      setMenuOpen(false);
                      router.push("/login?tab=register");
                    }}
                  >
                    Sign Up
                  </Link>
                </div>
                <div className="mt-2">
                  <Link
                    href="/astrologer/login"
                    className="block rounded-lg px-3 py-2 text-center text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                    onClick={(event) => {
                      event.preventDefault();
                      setMenuOpen(false);
                      router.push("/astrologer/login");
                    }}
                  >
                    Astrologer Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
