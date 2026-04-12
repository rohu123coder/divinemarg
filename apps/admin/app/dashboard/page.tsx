"use client";

import { useEffect, useState } from "react";

import api from "@/lib/api";

type Stats = {
  totalUsers: number;
  totalAstrologers: number;
  totalRevenue: number;
  activeSessions: number;
};

type TxRow = {
  id: string;
  user_phone: string;
  amount: number;
  created_at: string;
  status: string;
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    failed: "bg-red-100 text-red-800",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        colors[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          api.get<{ success: boolean; data: Stats }>("/api/admin/stats"),
          api.get<{
            success: boolean;
            data: { transactions: TxRow[] };
          }>("/api/admin/transactions", { params: { limit: 10, page: 1 } }),
        ]);
        if (cancelled) return;
        if (sRes.data.success) setStats(sRes.data.data);
        if (tRes.data.success) setTransactions(tRes.data.data.transactions);
      } catch {
        if (!cancelled) setError("Could not load dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const cards = [
    { label: "Total Users", value: stats?.totalUsers ?? "—" },
    { label: "Total Astrologers", value: stats?.totalAstrologers ?? "—" },
    {
      label: "Total Revenue",
      value:
        stats != null
          ? `₹${stats.totalRevenue.toLocaleString("en-IN", {
              maximumFractionDigits: 2,
            })}`
          : "—",
    },
    { label: "Active Sessions", value: stats?.activeSessions ?? "—" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of platform activity</p>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-sm font-medium text-slate-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold text-slate-900">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent transactions
          </h2>
          <p className="text-xs text-slate-500">Last 10 across all users</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">User phone</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={4}>
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {t.user_phone}
                    </td>
                    <td className="px-5 py-3">
                      ₹
                      {t.amount.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
