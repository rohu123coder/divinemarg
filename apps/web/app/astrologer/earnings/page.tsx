"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AstrologerNavbar } from "@/components/AstrologerNavbar";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

type DashboardData = {
  earnings_total: number;
  earnings_this_month: number;
  total_sessions: number;
  rating: number | null;
  last_7_days_earnings: Array<{ date: string; amount: number }>;
};

type HistorySession = {
  id: string;
  ended_at: string | null;
  started_at: string | null;
  total_minutes: number | null;
  total_charged: number | null;
  user_name: string;
};

export default function AstrologerEarningsPage() {
  const router = useRouter();
  const { user, token, isLoggedIn } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [sessions, setSessions] = useState<HistorySession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, hRes] = await Promise.all([
        api.get(`/api/astrologers/dashboard`),
        api.get(`/api/chat/history`, { params: { page: 1, limit: 100 } }),
      ]);
      setDash(dRes.data?.data as DashboardData);
      const rows = hRes.data?.data?.sessions as HistorySession[] | undefined;
      setSessions(rows ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (!isLoggedIn || !token) {
      router.replace("/astrologer/login");
      return;
    }
    if (user?.role !== "astrologer") {
      router.replace("/dashboard");
      return;
    }
    void load();
  }, [mounted, isLoggedIn, token, user?.role, router, load]);

  if (!mounted || !isLoggedIn || user?.role !== "astrologer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const chartData =
    dash?.last_7_days_earnings?.map((d) => ({
      date: d.date.slice(5),
      amount: d.amount,
    })) ?? [];

  return (
    <div className="min-h-screen bg-slate-100">
      <AstrologerNavbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">My Earnings</h1>

        {loading || !dash ? (
          <div className="mt-12 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Total earned
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  ₹{dash.earnings_total.toFixed(0)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  This month
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  ₹{dash.earnings_this_month.toFixed(0)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Total sessions
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {dash.total_sessions}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-medium uppercase text-slate-500">
                  Average rating
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {dash.rating != null ? `${dash.rating.toFixed(1)} ★` : "—"}
                </p>
              </div>
            </div>

            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Last 7 days
              </h2>
              <div className="mt-6 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(v: number) => [`₹${v.toFixed(0)}`, "Earned"]}
                    />
                    <Bar dataKey="amount" fill="#7c3aed" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Session history
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Client</th>
                      <th className="px-6 py-3">Duration</th>
                      <th className="px-6 py-3">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-8 text-center text-slate-500"
                        >
                          No completed sessions yet.
                        </td>
                      </tr>
                    ) : (
                      sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80">
                          <td className="px-6 py-3 text-slate-800">
                            {s.ended_at
                              ? new Date(s.ended_at).toLocaleDateString("en-IN")
                              : "—"}
                          </td>
                          <td className="px-6 py-3 text-slate-800">
                            {s.user_name}
                          </td>
                          <td className="px-6 py-3 text-slate-600">
                            {s.total_minutes != null ? `${s.total_minutes} min` : "—"}
                          </td>
                          <td className="px-6 py-3 font-medium text-slate-900">
                            ₹
                            {(s.total_charged != null
                              ? s.total_charged
                              : 0
                            ).toFixed(0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
