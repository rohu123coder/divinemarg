"use client";

import Link from "next/link";
import { useState } from "react";
import { KundliChart } from "./components/KundliChart";
import { KundliForm } from "./components/KundliForm";
import type { KundliCalculateResponse } from "./types";

function SectionTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-semibold tracking-tight text-violet-950 sm:text-2xl">
        {children}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      ) : null}
    </div>
  );
}

export default function KundliPage() {
  const [result, setResult] = useState<KundliCalculateResponse | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EDE9FE] via-white to-violet-50/40">
      <header className="border-b border-violet-100/80 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-semibold text-[#4C1D95] transition hover:text-violet-700"
          >
            DivineMarg
          </Link>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-800">
            Vedic · Sidereal · Lahiri
          </span>
        </div>
      </header>

      <KundliForm onSuccess={setResult} />

      {result ? (
        <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 sm:px-6">
          {result.birthTimeApproximate ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
              Birth time approximated to noon — ascendant &amp; houses are
              indicative; enter exact time for precision.
            </p>
          ) : null}

          <section>
            <SectionTitle subtitle="Lagna chart with signs & planets by house">
              Your birth chart
            </SectionTitle>
            <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
              <KundliChart chartData={result.chartData} />
              <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-lg shadow-violet-100/50">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-violet-600">
                  Snapshot
                </h3>
                <dl className="mt-4 grid gap-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Ascendant</dt>
                    <dd className="font-medium text-slate-900">
                      {result.basicInfo.ascendant.rashi}{" "}
                      <span className="text-violet-600">
                        {result.basicInfo.ascendant.degree}°
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Moon sign</dt>
                    <dd className="font-medium text-slate-900">
                      {result.basicInfo.moonSign.rashi}{" "}
                      <span className="text-violet-600">
                        {result.basicInfo.moonSign.degree}°
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Sun sign</dt>
                    <dd className="font-medium text-slate-900">
                      {result.basicInfo.sunSign.rashi}{" "}
                      <span className="text-violet-600">
                        {result.basicInfo.sunSign.degree}°{" "}
                        {result.basicInfo.sunSign.minutes}′
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                    <dt className="text-slate-500">Nakshatra</dt>
                    <dd className="font-medium text-slate-900">
                      {result.basicInfo.nakshatra.name}{" "}
                      <span className="text-slate-500">
                        (Pada {result.basicInfo.nakshatra.pada}, lord{" "}
                        {result.basicInfo.nakshatra.lord})
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Name number</dt>
                    <dd className="font-medium text-violet-700">
                      {result.basicInfo.numerologyNumber}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          <section>
            <SectionTitle subtitle="Sidereal longitudes · retrograde marked">
              Planetary positions
            </SectionTitle>
            <div className="overflow-x-auto rounded-2xl border border-violet-100 bg-white shadow-md">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-violet-100 bg-violet-50/80 text-violet-900">
                    <th className="px-4 py-3 font-semibold">Planet</th>
                    <th className="px-4 py-3 font-semibold">Sign</th>
                    <th className="px-4 py-3 font-semibold">House</th>
                    <th className="px-4 py-3 font-semibold">Deg</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.planets.map((p) => (
                    <tr
                      key={p.name}
                      className="border-b border-slate-50 hover:bg-violet-50/30"
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        <span className="mr-2 text-violet-600">{p.symbol}</span>
                        {p.name}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">{p.rashi}</td>
                      <td className="px-4 py-2.5 text-violet-800">{p.house}</td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-600">
                        {p.degree}° {p.minutes}′
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">
                        {p.isRetrograde ? (
                          <span className="rounded bg-slate-200 px-1.5 py-0.5">
                            ℞
                          </span>
                        ) : null}{" "}
                        {p.isExalted ? (
                          <span className="text-emerald-600">Exalted</span>
                        ) : null}{" "}
                        {p.isDebilitated ? (
                          <span className="text-rose-600">Debilitated</span>
                        ) : null}{" "}
                        {p.ownSign ? (
                          <span className="text-violet-600">Own</span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
              <SectionTitle>Vimshottari Dasha</SectionTitle>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span className="text-slate-500">Mahadasha</span>
                  <span className="font-semibold text-violet-900">
                    {result.dasha.mahadasha.planet}
                  </span>
                </li>
                <li className="flex justify-between text-xs text-slate-500">
                  <span>
                    {result.dasha.mahadasha.startDate} →{" "}
                    {result.dasha.mahadasha.endDate}
                  </span>
                </li>
                <li className="flex justify-between border-t border-slate-100 pt-2">
                  <span className="text-slate-500">Antardasha</span>
                  <span className="font-medium text-slate-900">
                    {result.dasha.antardasha.planet}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-500">Pratyantar</span>
                  <span className="font-medium text-slate-900">
                    {result.dasha.pratyantar.planet}
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-white p-6 shadow-md">
              <SectionTitle>Doshas</SectionTitle>
              <ul className="space-y-2 text-sm">
                <li className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-600">Mangal Dosha</span>
                  <span
                    className={
                      result.doshas.mangalDosha.present
                        ? "rounded-full bg-rose-100 px-2 py-0.5 text-rose-800"
                        : "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-800"
                    }
                  >
                    {result.doshas.mangalDosha.present ? "Present" : "None"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {result.doshas.mangalDosha.type} ·{" "}
                    {result.doshas.mangalDosha.severity}
                  </span>
                </li>
                <li className="text-xs text-slate-600">
                  Sade Sati:{" "}
                  {result.doshas.sadeSati.present ? (
                    <>
                      active ({result.doshas.sadeSati.phase}) — approx{" "}
                      {result.doshas.sadeSati.startYear}–
                      {result.doshas.sadeSati.endYear}
                    </>
                  ) : (
                    "not indicated at current transit"
                  )}
                </li>
                <li className="text-xs text-slate-600">
                  Kaal Sarp:{" "}
                  {result.doshas.kaalsarpDosha.present
                    ? "flagged — consult full chart"
                    : "not flagged"}
                </li>
              </ul>
            </div>
          </section>

          <section>
            <SectionTitle subtitle="Classical combinations detected in your chart">
              Yogas
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              {result.yogas.map((y) => (
                <div
                  key={y.name}
                  className={`rounded-xl border p-4 ${
                    y.present
                      ? "border-violet-300 bg-violet-50/80"
                      : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900">{y.name}</h3>
                    <span
                      className={
                        y.present
                          ? "text-xs font-medium text-violet-700"
                          : "text-xs text-slate-400"
                      }
                    >
                      {y.present ? "Present" : "—"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{y.description}</p>
                  <p className="mt-2 text-xs text-slate-500">{y.effect}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Interpretations</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(result.predictions).map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-xl border border-violet-100 bg-white p-5 shadow-sm"
                >
                  <h3 className="capitalize text-sm font-semibold text-violet-800">
                    {k.replace(/([A-Z])/g, " $1").trim()}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {v}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      <footer className="border-t border-violet-100 bg-violet-950/5 py-8 text-center text-xs text-slate-500">
        DivineMarg — Vedic astrology for clarity &amp; confidence. Results are
        algorithmic; consult a qualified astrologer for life decisions.
      </footer>
    </div>
  );
}
