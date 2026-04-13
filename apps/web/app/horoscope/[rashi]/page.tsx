"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Navbar } from "@/components/Navbar";
import { type HoroscopeResponse, type Period } from "@/lib/horoscope";

const periods: Array<{ id: Period; label: string }> = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

function renderStars(value: number) {
  const clamped = Math.max(1, Math.min(5, value));
  return `${"⭐".repeat(clamped)}${"☆".repeat(5 - clamped)}`;
}

export default function RashiHoroscopePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rashiParam = typeof params.rashi === "string" ? params.rashi : "";
  const initialPeriod = searchParams.get("period");
  const [period, setPeriod] = useState<Period>(
    initialPeriod === "tomorrow" ||
      initialPeriod === "weekly" ||
      initialPeriod === "monthly"
      ? initialPeriod
      : "today"
  );
  const [data, setData] = useState<HoroscopeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodLabel = useMemo(
    () => periods.find((item) => item.id === period)?.label ?? "Today",
    [period]
  );

  const updatePeriod = (nextPeriod: Period) => {
    setPeriod(nextPeriod);
    const next = new URLSearchParams(searchParams.toString());
    next.set("period", nextPeriod);
    router.replace(`/horoscope/${rashiParam}?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/horoscope?rashi=${rashiParam}&period=${period}`
        );
        if (!res.ok) {
          const body = (await res.json()) as { error?: string };
          throw new Error(body.error ?? "Failed to fetch horoscope");
        }
        const json = (await res.json()) as HoroscopeResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setError(e instanceof Error ? e.message : "Unable to load horoscope");
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
  }, [rashiParam, period]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-fuchsia-50 pb-12">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <Link href="/horoscope" className="text-sm font-semibold text-violet-700">
            ← Back to all rashis
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {periods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updatePeriod(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                item.id === period
                  ? "bg-violet-600 text-white shadow-md"
                  : "bg-white text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 h-72 animate-pulse rounded-2xl bg-violet-100/70" />
        ) : error || !data ? (
          <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6 text-red-700">
            {error ?? "Horoscope not available."}
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-violet-700">{periodLabel}</p>
              <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
                {data.rashi.symbol} {data.rashi.hindi} ({data.rashi.english}) Rashifal
              </h1>
              <p className="mt-2 text-sm text-slate-600">{data.rashi.dateRange}</p>
              <p className="mt-1 text-sm text-slate-600">
                Lord: <span className="font-semibold">{data.rashi.lord}</span>
              </p>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">A) Today&apos;s Overview</h2>
              <p className="mt-3 text-sm leading-7 text-slate-700">
                {data.todayOverview}
              </p>
            </section>

            <section className="grid gap-4 rounded-2xl border border-violet-100 bg-white p-6 text-sm shadow-sm sm:grid-cols-3">
              <p>
                <span className="font-semibold text-slate-900">B) Lucky Number:</span>{" "}
                {data.lucky.number}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Lucky Color:</span>{" "}
                {data.lucky.color}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Lucky Time:</span>{" "}
                {data.lucky.time}
              </p>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                C) Life Areas Rating
              </h2>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <p>Love & Relationships: {renderStars(data.ratings.love)}</p>
                <p>Career & Business: {renderStars(data.ratings.career)}</p>
                <p>Health & Wellness: {renderStars(data.ratings.health)}</p>
                <p>Finance & Money: {renderStars(data.ratings.finance)}</p>
              </div>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                D) Detailed Predictions
              </h2>
              <div className="mt-4 grid gap-4 text-sm leading-7 text-slate-700 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-slate-900">Love:</span>{" "}
                  {data.predictions.love}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Career:</span>{" "}
                  {data.predictions.career}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Health:</span>{" "}
                  {data.predictions.health}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Finance:</span>{" "}
                  {data.predictions.finance}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Family:</span>{" "}
                  {data.predictions.family}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Travel:</span>{" "}
                  {data.predictions.travel}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                E) Today&apos;s Remedy
              </h2>
              <p className="mt-3 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Mantra:</span>{" "}
                {data.remedy.mantra}
              </p>
              <p className="mt-2 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Daan:</span>{" "}
                {data.remedy.daan}
              </p>
            </section>

            <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                F) Compatible Rashis Today
              </h2>
              <div className="mt-4 flex flex-wrap gap-3">
                {data.compatibleRashis.map((item) => (
                  <Link
                    key={item.id}
                    href={`/horoscope/${item.id}?period=${period}`}
                    className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-200"
                  >
                    {item.symbol} {item.hindi} ({item.english})
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-600 to-fuchsia-500 p-6 text-white shadow-md">
              <h2 className="text-xl font-bold">G) Consult Astrologer</h2>
              <p className="mt-2 text-sm text-violet-50">
                Need deeper guidance for relationships, career, or life
                decisions? Connect instantly with verified astrologers.
              </p>
              <Link
                href="/astrologers"
                className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-violet-700 transition hover:opacity-95"
              >
                Consult Astrologer
              </Link>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
