"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Navbar } from "@/components/Navbar";
import { WalletWidget } from "@/components/WalletWidget";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string;
};

type AstrologerDetail = {
  id: string;
  bio: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  total_reviews: number;
  price_per_minute: number | null;
  is_available: boolean;
  experience_years: number | null;
  user: {
    name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
  };
};

function StarRow({ value }: { value: number }) {
  return (
    <span className="text-amber-500" aria-hidden>
      {"★".repeat(Math.round(value))}
      <span className="text-slate-200">
        {"★".repeat(Math.max(0, 5 - Math.round(value)))}
      </span>
    </span>
  );
}

export default function AstrologerProfilePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const [data, setData] = useState<{
    astrologer: AstrologerDetail;
    reviews: Review[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/astrologers/${id}`);
        const d = res.data?.data as {
          astrologer: AstrologerDetail;
          reviews: Review[];
        };
        if (!cancelled && d) {
          setData(d);
        }
      } catch {
        if (!cancelled) {
          setError("Astrologer not found");
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
  }, [id]);

  const startChat = useCallback(async () => {
    if (!data) {
      return;
    }
    if (!isLoggedIn) {
      router.push(`/login`);
      return;
    }
    const price = data.astrologer.price_per_minute ?? 0;
    const min = price * 5;
    const bal = user?.wallet_balance ?? 0;
    if (bal < min) {
      setRechargeOpen(true);
      return;
    }
    setChatLoading(true);
    try {
      const res = await api.post(`/api/chat/request`, {
        astrologer_id: data.astrologer.id,
      });
      const sessionId = res.data?.data?.session_id as string | undefined;
      if (!sessionId) {
        throw new Error("No session");
      }
      const name = encodeURIComponent(data.astrologer.user.name);
      router.push(`/chat/${sessionId}?name=${name}`);
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
          : "Could not start chat";
      setError(msg);
    } finally {
      setChatLoading(false);
    }
  }, [data, isLoggedIn, router, user?.wallet_balance]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl animate-pulse px-4 py-10 sm:px-6">
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="mt-8 h-64 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <p className="text-slate-700">{error ?? "Not found"}</p>
          <Link
            href="/astrologers"
            className="mt-6 inline-block font-semibold text-violet-600"
          >
            ← Back to astrologers
          </Link>
        </div>
      </div>
    );
  }

  const { astrologer, reviews } = data;
  const price = astrologer.price_per_minute ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 lg:pb-10">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-violet-600/90 to-indigo-600/90 px-6 py-10 text-white">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {astrologer.user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={astrologer.user.avatar_url}
                  alt=""
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-white/30"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 text-3xl font-bold ring-4 ring-white/30">
                  {astrologer.user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold">{astrologer.user.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/90">
                  <StarRow value={astrologer.rating ?? 0} />
                  <span>
                    ({astrologer.total_reviews} review
                    {astrologer.total_reviews === 1 ? "" : "s"})
                  </span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
                    ₹{price.toFixed(0)} / min
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {astrologer.specializations.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-sm text-white/85">
                  Languages: {astrologer.languages.join(", ")}
                </p>
                {astrologer.experience_years != null ? (
                  <p className="mt-1 text-sm text-white/85">
                    {astrologer.experience_years}+ years experience
                  </p>
                ) : null}
              </div>
              <div className="hidden lg:block">
                <button
                  type="button"
                  disabled={!astrologer.is_available || chatLoading}
                  onClick={() => void startChat()}
                  className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-violet-700 shadow-md transition hover:bg-white/95 disabled:cursor-not-allowed disabled:bg-white/50 disabled:text-violet-400"
                >
                  {chatLoading
                    ? "Starting…"
                    : astrologer.is_available
                      ? "Chat Now"
                      : "Offline"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-slate-600">
            {astrologer.bio?.trim()
              ? astrologer.bio
              : "This astrologer hasn’t added a bio yet."}
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No reviews yet.</p>
          ) : (
            <ul className="mt-4 space-y-6">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-slate-100 pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {r.user_name}
                    </span>
                    <StarRow value={r.rating} />
                    <span className="text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur lg:hidden">
        <button
          type="button"
          disabled={!astrologer.is_available || chatLoading}
          onClick={() => void startChat()}
          className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {chatLoading
            ? "Starting…"
            : astrologer.is_available
              ? "Chat Now"
              : "Offline"}
        </button>
      </div>

      {rechargeOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">
                Wallet balance low
              </h2>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-800"
                onClick={() => setRechargeOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              You need at least{" "}
              <span className="font-semibold">
                ₹{(price * 5).toFixed(0)}
              </span>{" "}
              for a minimum chat ({`5 × ₹${price.toFixed(0)}`} per minute
              rate). Recharge to continue.
            </p>
            <div className="mt-5">
              <WalletWidget />
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700"
              onClick={() => setRechargeOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
