"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";

import api from "@/lib/api";
import { getSocketApiBase } from "@/lib/socketBase";
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
  const pathname = usePathname();
  const { user, isLoggedIn, logout, isWalletRefreshing, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasOnlineAstrologers, setHasOnlineAstrologers] = useState(false);

  const centerLinks = [
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

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.get("/api/astrologers", {
          params: { online: true, limit: 1, page: 1 },
        });
        const total = Number(res.data?.data?.total ?? 0);
        if (!cancelled) {
          setHasOnlineAstrologers(total > 0);
        }
      } catch {
        if (!cancelled) {
          setHasOnlineAstrologers(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!token || !isLoggedIn) {
      return;
    }
    const socket: Socket = io(getSocketApiBase(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socket.on("astrologer_status_changed", (payload: { is_online: boolean }) => {
      if (payload.is_online) {
        setHasOnlineAstrologers(true);
      } else {
        void (async () => {
          try {
            const res = await api.get("/api/astrologers", {
              params: { online: true, limit: 1, page: 1 },
            });
            const total = Number(res.data?.data?.total ?? 0);
            setHasOnlineAstrologers(total > 0);
          } catch {
            setHasOnlineAstrologers(false);
          }
        })();
      }
    });
    return () => socket.disconnect();
  }, [isLoggedIn, token]);

  const balance = user?.wallet_balance ?? 0;
  const role = user?.role;
  const dashboardHref =
    role === "astrologer" ? "/astrologer/dashboard" : "/dashboard";

  const isActive = useMemo(
    () => (href: string) => {
      const cleanHref = href.split("?")[0];
      if (cleanHref === "/") {
        return pathname === "/";
      }
      return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
    },
    [pathname]
  );

  // Astrologer pages use their own dedicated navbar component.
  if (mounted && isLoggedIn && role === "astrologer") {
    return null;
  }

  const chatCta = (
    <Link
      href="/astrologers"
      className="inline-flex items-center gap-2 rounded-full bg-[#16A34A] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
      onClick={() => setMenuOpen(false)}
    >
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          hasOnlineAstrologers ? "animate-online-pulse bg-emerald-200" : "bg-emerald-100"
        }`}
      />
      Chat with Astrologer
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0"
          onClick={() => setMenuOpen(false)}
          aria-label="DivineMarg home"
        >
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="DivineMarg"
              width={140}
              height={40}
              className="h-10 w-auto object-contain"
            />
            <span className="text-[22px] font-bold text-[#B8960C]">
              DivineMarg
            </span>
          </div>
        </Link>

        <nav
          className="hidden flex-1 items-center justify-center md:flex"
          aria-label="Main navigation"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            {centerLinks.map((link, idx) => (
              <Fragment key={link.label}>
                {idx > 0 ? (
                  <span className="text-slate-300" aria-hidden="true">
                    |
                  </span>
                ) : null}
                <Link
                  href={link.href}
                  className={`whitespace-nowrap border-b-2 pb-0.5 text-[14px] font-medium transition ${
                    isActive(link.href)
                      ? "border-[#B8960C] text-[#B8960C]"
                      : "border-transparent text-slate-700 hover:text-[#B8960C]"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </div>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!mounted ? (
            <div className="h-9 w-44 animate-pulse rounded-full bg-slate-100" />
          ) : isLoggedIn ? (
            <>
              {role !== "astrologer" ? (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:text-sm">
                  {isWalletRefreshing ? "Updating..." : formatMoney(balance)}
                </span>
              ) : null}
              {chatCta}
              <Link
                href={dashboardHref}
                className={`rounded-md px-2 py-1 text-sm font-semibold transition ${
                  isActive(dashboardHref)
                    ? "text-[#B8960C]"
                    : "text-slate-700 hover:text-[#B8960C]"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                Dashboard
              </Link>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-sm font-semibold text-slate-600 transition hover:text-red-600"
                onClick={() => logout()}
              >
                Logout
              </button>
              <Link
                href="/astrologer/login"
                className="text-xs text-slate-400 transition hover:text-slate-600"
              >
                Astrologer Login
              </Link>
            </>
          ) : (
            <>
              {chatCta}
              <Link
                href="/login"
                className="rounded-full border border-transparent px-3 py-2 text-sm font-semibold text-slate-700 transition hover:text-[#B8960C]"
                onClick={(event) => {
                  event.preventDefault();
                  router.push("/login");
                }}
              >
                Sign In
              </Link>
              <Link
                href="/login?tab=register"
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700"
                onClick={(event) => {
                  event.preventDefault();
                  router.push("/login?tab=register");
                }}
              >
                Sign Up
              </Link>
              <Link
                href="/astrologer/login"
                className="text-xs text-slate-400 transition hover:text-slate-600"
                onClick={() => setMenuOpen(false)}
              >
                Astrologer Login
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {!mounted ? null : isLoggedIn && role === "user" ? (
            <span className="max-w-[6.5rem] truncate rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
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
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <div>
              <p className="px-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nav links
              </p>
              <div className="mt-2 space-y-1">
                {centerLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`block rounded-md px-3 py-2 text-sm font-medium ${
                      isActive(link.href)
                        ? "bg-amber-50 text-[#B8960C]"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-4">
              <div className="w-full">{chatCta}</div>

              {isLoggedIn ? (
                <>
                  <Link
                    href={dashboardHref}
                    className="block rounded-full border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    className="block w-full rounded-full border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
                      className="rounded-full border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold text-slate-700"
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
                      className="rounded-full bg-violet-600 px-3 py-2.5 text-center text-sm font-semibold text-white"
                      onClick={(event) => {
                        event.preventDefault();
                        setMenuOpen(false);
                        router.push("/login?tab=register");
                      }}
                    >
                      Sign Up
                    </Link>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/astrologer/login"
                      className="block text-center text-xs text-slate-400 transition hover:text-slate-600"
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
        </div>
      ) : null}
    </header>
  );
}
