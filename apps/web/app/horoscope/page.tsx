"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Navbar } from "@/components/Navbar";
import {
  rashis,
  type HoroscopeResponse,
  type Period,
} from "@/lib/horoscope";

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

export default function HoroscopePage() {
  const [period, setPeriod] = useState<Period>("today");
  const [selectedRashi, setSelectedRashi] = useState<string>(rashis[0].id);
  const [data, setData] = useState<HoroscopeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedMeta = useMemo(
    () => rashis.find((r) => r.id === selectedRashi) ?? rashis[0],
    [selectedRashi]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/horoscope?rashi=${selectedRashi}&period=${period}`
        );
        if (!res.ok) {
          throw new Error("Could not fetch horoscope");
        }
        const json = (await res.json()) as HoroscopeResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch {
        if (!cancelled) {
          setData(null);
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
  }, [selectedRashi, period]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-fuchsia-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <header className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Aaj Ka Rashifal | Daily Horoscope 2026
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
            Choose your rashi and get personalized guidance for love, career,
            health, finance, family, and travel.
          </p>
        </header>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {periods.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                period === item.id
                  ? "bg-violet-600 text-white shadow-md"
                  : "bg-white text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rashis.map((rashi) => (
            <article
              key={rashi.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${
                selectedRashi === rashi.id
                  ? "border-violet-400 ring-2 ring-violet-200"
                  : "border-violet-100"
              }`}
              style={{
                background: `linear-gradient(135deg, ${rashi.color}22 0%, #ffffff 55%)`,
              }}
            >
              <p className="text-4xl">{rashi.symbol}</p>
              <h2 className="mt-3 text-xl font-bold text-slate-900">
                {rashi.hindi} ({rashi.english})
              </h2>
              <p className="mt-1 text-sm text-slate-600">{rashi.dateRange}</p>
              <button
                type="button"
                onClick={() => setSelectedRashi(rashi.id)}
                className="mt-4 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
              >
                Read Horoscope
              </button>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-violet-700">
                Selected Rashi
              </p>
              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                {selectedMeta.symbol} {selectedMeta.hindi} ({selectedMeta.english})
              </h3>
            </div>
            <Link
              href={`/horoscope/${selectedMeta.id}?period=${period}`}
              className="rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-200"
            >
              Open full page
            </Link>
          </div>

          {loading ? (
            <div className="mt-6 h-44 animate-pulse rounded-xl bg-violet-100/60" />
          ) : data ? (
            <div className="mt-6 space-y-5">
              <div>
                <h4 className="font-bold text-slate-900">Today&apos;s Overview</h4>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  {data.todayOverview}
                </p>
              </div>
              <div className="grid gap-3 rounded-xl bg-violet-50 p-4 text-sm sm:grid-cols-3">
                <p>
                  <span className="font-semibold text-slate-900">
                    Lucky Number:
                  </span>{" "}
                  {data.lucky.number}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">
                    Lucky Color:
                  </span>{" "}
                  {data.lucky.color}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">
                    Lucky Time:
                  </span>{" "}
                  {data.lucky.time}
                </p>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p>Love & Relationships: {renderStars(data.ratings.love)}</p>
                <p>Career & Business: {renderStars(data.ratings.career)}</p>
                <p>Health & Wellness: {renderStars(data.ratings.health)}</p>
                <p>Finance & Money: {renderStars(data.ratings.finance)}</p>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-red-600">
              Unable to load horoscope right now.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
