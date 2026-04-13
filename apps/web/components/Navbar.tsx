"use client";

import Link from "next/link";
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
  const { user, isLoggedIn, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const balance = user?.wallet_balance ?? 0;

  return (
    <header className="sticky top-0 z-50 border-b border-violet-200/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <span className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-orange-500 bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
            ✨ DivineMarg
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/horoscope"
            className="text-sm font-medium text-slate-700 transition hover:text-purple-600"
          >
            🔮 Rashifal
          </Link>
          {!mounted ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />
          ) : isLoggedIn ? (
            <>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                {formatMoney(balance)}
              </span>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-slate-700 transition hover:text-purple-600"
              >
                My Chats
              </Link>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full ring-2 ring-violet-100 transition hover:ring-violet-300"
                  aria-expanded={accountOpen}
                  aria-haspopup="true"
                >
                  {user?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-400 text-sm font-bold text-white">
                      {(user?.name ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </button>
                {accountOpen ? (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => setAccountOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-gradient-to-r from-purple-600 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Login
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {!mounted ? null : isLoggedIn ? (
            <span className="max-w-[5.5rem] truncate rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              {formatMoney(balance)}
            </span>
          ) : null}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
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
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <Link
            href="/horoscope"
            className="block rounded-lg px-3 py-2 text-slate-800 hover:bg-slate-50"
            onClick={() => setMenuOpen(false)}
          >
            🔮 Rashifal
          </Link>
          {isLoggedIn ? (
            <div className="flex flex-col gap-3">
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-slate-800 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                My Chats
              </Link>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="block rounded-full bg-gradient-to-r from-purple-600 to-orange-500 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          )}
        </div>
      ) : null}
    </header>
  );
}
