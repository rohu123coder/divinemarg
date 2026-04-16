"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import api from "@/lib/api";
import { useAuthStore, type AuthUser } from "@/lib/store";

type AstrologerLoginPayload = {
  id: string;
  user_id: string;
  is_approved?: boolean;
  /** Back-compat with existing backend column naming */
  is_verified?: boolean;
  user: {
    name: string;
    phone: string;
    avatar_url: string | null;
    email: string;
  };
};

export default function AstrologerLoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const { isLoggedIn, user, token } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (isLoggedIn && token && user?.role === "astrologer") {
      if (user.isApproved === false) {
        router.replace("/astrologer/pending");
      } else {
        router.replace("/astrologer/dashboard");
      }
    }
    if (isLoggedIn && token && user?.role === "user") {
      router.replace("/dashboard");
    }
  }, [mounted, isLoggedIn, token, user?.role, user?.isApproved, router]);

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/api/auth/astrologer/login`, {
        email: email.trim(),
        password,
      });
      const data = res.data?.data as {
        token: string;
        astrologer: AstrologerLoginPayload;
      };
      if (!data?.token || !data.astrologer) {
        throw new Error("Invalid response");
      }
      const a = data.astrologer;
      const authUser: AuthUser = {
        id: a.user_id,
        name: a.user.name,
        phone: a.user.phone,
        avatar_url: a.user.avatar_url,
        wallet_balance: 0,
        role: "astrologer",
        astrologerId: a.id,
        isApproved: Boolean(a.is_approved ?? a.is_verified ?? false),
      };
      setUser(authUser, data.token);
      if (authUser.isApproved === false) {
        router.replace("/astrologer/pending");
      } else {
        router.replace("/astrologer/dashboard");
      }
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "error" in e.response.data
          ? String((e.response.data as { error?: string }).error)
          : "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Astrologer sign in
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your registered email and password.
        </p>

        <div className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-violet-500 focus:ring-2"
            placeholder="you@example.com"
          />
          <label className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-violet-500 focus:ring-2"
          />
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={loading}
            onClick={() => void submit()}
            className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <Link
            href="/astrologer/register"
            className="block pt-2 text-center text-sm font-semibold text-slate-600 hover:text-violet-700"
          >
            New astrologer? Register here →
          </Link>
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          <Link href="/login" className="text-violet-600 hover:underline">
            User login
          </Link>
          {" · "}
          <Link href="/" className="text-violet-600 hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
}
