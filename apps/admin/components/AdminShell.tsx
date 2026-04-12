"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAdminStore } from "@/lib/store";
import { useAdminHydrated } from "@/lib/useAdminHydrated";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/astrologers", label: "Astrologers" },
  { href: "/users", label: "Users" },
  { href: "/transactions", label: "Transactions" },
  { href: "/settings", label: "Settings" },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useAdminHydrated();
  const isLoggedIn = useAdminStore((s) => s.isLoggedIn);
  const logout = useAdminStore((s) => s.logout);

  const isLogin = pathname === "/login";

  useEffect(() => {
    if (!hydrated || isLogin) return;
    if (!isLoggedIn) {
      router.replace("/login");
    }
  }, [hydrated, isLoggedIn, isLogin, router]);

  if (isLogin) {
    return <>{children}</>;
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading…
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-6">
          <div className="text-lg font-bold tracking-tight text-indigo-600">
            DivineMarg Admin
          </div>
          <div className="mt-1 text-xs text-slate-500">Operations console</div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
