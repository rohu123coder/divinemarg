"use client";

import { useCallback, useEffect, useState } from "react";

import api from "@/lib/api";

type TxRow = {
  id: string;
  user_phone: string;
  type: string;
  amount: number;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  status: string;
  created_at: string;
};

function TypeBadge({ type }: { type: string }) {
  const isRecharge = type === "recharge";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        isRecharge
          ? "bg-indigo-100 text-indigo-800"
          : type === "deduction"
            ? "bg-orange-100 text-orange-800"
            : "bg-slate-100 text-slate-700"
      }`}
    >
      {type}
    </span>
  );
}

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

function razorpayId(row: TxRow): string {
  return row.razorpay_payment_id ?? row.razorpay_order_id ?? "—";
}

function toCsv(rows: TxRow[]): string {
  const headers = [
    "user_phone",
    "type",
    "amount",
    "razorpay_id",
    "status",
    "created_at",
  ];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        esc(r.user_phone),
        esc(r.type),
        String(r.amount),
        esc(razorpayId(r) === "—" ? "" : razorpayId(r)),
        esc(r.status),
        esc(new Date(r.created_at).toISOString()),
      ].join(",")
    ),
  ];
  return lines.join("\n");
}

export default function TransactionsPage() {
  const [items, setItems] = useState<TxRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<{
        success: boolean;
        data: { transactions: TxRow[]; total: number };
      }>("/api/admin/transactions", {
        params: {
          page,
          limit,
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(status ? { status } : {}),
        },
      });
      if (res.data.success) {
        setItems(res.data.data.transactions);
        setTotal(res.data.data.total);
      }
    } catch {
      setErr("Could not load transactions");
    } finally {
      setLoading(false);
    }
  }, [page, limit, from, to, status]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [from, to, status]);

  async function exportCsv() {
    setExporting(true);
    try {
      const res = await api.get<{
        success: boolean;
        data: { transactions: TxRow[] };
      }>("/api/admin/transactions", {
        params: {
          page: 1,
          limit: 10000,
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(status ? { status } : {}),
        },
      });
      if (!res.data.success) return;
      const csv = toCsv(res.data.data.transactions);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setErr("Export failed");
    } finally {
      setExporting(false);
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500">Wallet recharges and deductions</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="">All</option>
              <option value="pending">pending</option>
              <option value="success">success</option>
              <option value="failed">failed</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => void exportCsv()}
            disabled={exporting}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      </div>

      {err ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">User phone</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Razorpay ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={6}>
                    No transactions match filters
                  </td>
                </tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {t.user_phone}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={t.type} />
                    </td>
                    <td className="px-4 py-3">
                      ₹
                      {t.amount.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {razorpayId(t)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
          <span className="text-slate-500">
            Page {page} of {pages} · {total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-3 py-1 font-medium disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="rounded-lg border border-slate-200 px-3 py-1 font-medium disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
