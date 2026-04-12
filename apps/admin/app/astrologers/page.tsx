"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import api from "@/lib/api";

type AstroRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  rating: number | null;
  is_verified: boolean;
  is_available: boolean;
  total_earnings: number;
};

function VerifiedBadge({ verified }: { verified: boolean }) {
  return verified ? (
    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
      Verified
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
      Unverified
    </span>
  );
}

const webBase = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3000";

export default function AstrologersPage() {
  const [items, setItems] = useState<AstroRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await api.get<{
        success: boolean;
        data: { astrologers: AstroRow[]; total: number; page: number };
      }>("/api/admin/astrologers", {
        params: {
          page,
          limit,
          ...(debounced ? { search: debounced } : {}),
        },
      });
      if (res.data.success) {
        setItems(res.data.data.astrologers);
        setTotal(res.data.data.total);
      }
    } catch {
      setErr("Could not load astrologers");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  async function verifyId(id: string) {
    try {
      await api.post(`/api/admin/astrologers/${id}/verify`);
      await load();
    } catch {
      setErr("Verify failed");
    }
  }

  async function suspendId(id: string) {
    try {
      await api.post(`/api/admin/astrologers/${id}/suspend`);
      await load();
    } catch {
      setErr("Suspend failed");
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Astrologers</h1>
          <p className="text-sm text-slate-500">Manage verification and status</p>
        </div>
        <input
          type="search"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2 sm:w-72"
        />
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
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone / Email</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Total earnings</th>
                <th className="px-4 py-3 text-right">Actions</th>
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
                    No astrologers found
                  </td>
                </tr>
              ) : (
                items.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {a.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{a.phone}</div>
                      <div className="text-xs text-slate-500">{a.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <VerifiedBadge verified={a.is_verified} />
                    </td>
                    <td className="px-4 py-3">
                      {a.rating != null ? a.rating.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      ₹
                      {a.total_earnings.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {!a.is_verified ? (
                          <button
                            type="button"
                            onClick={() => void verifyId(a.id)}
                            className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            Verify
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void suspendId(a.id)}
                          className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Suspend
                        </button>
                        <Link
                          href={`${webBase}/astrologers/${a.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          View profile
                        </Link>
                      </div>
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
