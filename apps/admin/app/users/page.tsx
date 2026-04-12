"use client";

import { useCallback, useEffect, useState } from "react";

import api from "@/lib/api";

type UserRow = {
  id: string;
  name: string;
  phone: string;
  wallet_balance: number;
  total_spent: number;
  is_suspended: boolean;
  join_date: string;
};

export default function UsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
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
        data: { users: UserRow[]; total: number };
      }>("/api/admin/users", {
        params: {
          page,
          limit,
          ...(debounced ? { search: debounced } : {}),
        },
      });
      if (res.data.success) {
        setItems(res.data.data.users);
        setTotal(res.data.data.total);
      }
    } catch {
      setErr("Could not load users");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced]);

  useEffect(() => {
    void load();
  }, [load]);

  async function suspendUser(id: string) {
    if (!confirm("Suspend this user?")) return;
    try {
      await api.post(`/api/admin/users/${id}/suspend`);
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
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500">Customers on the platform</p>
        </div>
        <input
          type="search"
          placeholder="Search by phone…"
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
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Total spent</th>
                <th className="px-4 py-3">Join date</th>
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
                    No users found
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {u.name}
                      {u.is_suspended ? (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                          Suspended
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.phone}</td>
                    <td className="px-4 py-3">
                      ₹
                      {u.wallet_balance.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3">
                      ₹
                      {u.total_spent.toLocaleString("en-IN", {
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(u.join_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={u.is_suspended}
                        onClick={() => void suspendUser(u.id)}
                        className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-40"
                      >
                        Suspend
                      </button>
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
