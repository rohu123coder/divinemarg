"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Navbar } from "@/components/Navbar";
import { WalletWidget } from "@/components/WalletWidget";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

type SessionRow = {
  id: string;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  total_minutes: number | null;
  total_charged: number | null;
  astrologer_name: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, token, refreshWalletBalance } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (!isLoggedIn || !token) {
      router.replace("/login");
      return;
    }
    if (user?.role === "astrologer") {
      router.replace("/astrologer/dashboard");
      return;
    }
    void refreshWalletBalance();
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/chat/history`, {
          params: { page: 1, limit: 20 },
        });
        const list = res.data?.data?.sessions as SessionRow[] | undefined;
        if (!cancelled && list) {
          setSessions(list);
        }
      } catch {
        if (!cancelled) {
          setSessions([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mounted, isLoggedIn, token, router, user?.role, refreshWalletBalance]);

  useEffect(() => {
    if (!mounted || !isLoggedIn || !token) {
      return;
    }
    if (pathname === "/dashboard") {
      void refreshWalletBalance();
    }
  }, [mounted, isLoggedIn, token, pathname, refreshWalletBalance]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your wallet and continue conversations with astrologers.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Wallet</h2>
          <p className="mt-1 text-sm text-slate-600">
            Recharge securely to start new chat sessions.
          </p>
          <div className="mt-4">
            <WalletWidget />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/astrologers"
            className="inline-flex rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          >
            Browse Astrologers
          </Link>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-900">Recent chats</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-2 p-6">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded bg-slate-100"
                  />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <p className="p-6 text-sm text-slate-600">
                No chats yet. Browse an astrologer to get started.
              </p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Astrologer</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Duration</th>
                    <th className="px-4 py-3 font-medium">Charged</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.map((s) => {
                    const dateSrc = s.ended_at ?? s.started_at;
                    return (
                      <tr key={s.id} className="text-slate-800">
                        <td className="px-4 py-3 font-medium">
                          {s.astrologer_name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {dateSrc
                            ? new Date(dateSrc).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {s.total_minutes != null
                            ? `${s.total_minutes} min`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {s.total_charged != null
                            ? `₹${Number(s.total_charged).toFixed(0)}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              s.status === "ended"
                                ? "bg-slate-100 text-slate-700"
                                : s.status === "active"
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                                  : "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
