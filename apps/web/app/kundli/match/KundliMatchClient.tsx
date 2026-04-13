"use client";

import { useMemo, useState } from "react";

import { Navbar } from "@/components/Navbar";

type PersonDetails = {
  name: string;
  dob: string;
  tob: string;
  place: string;
};

type KootResult = {
  name: string;
  max: number;
  score: number;
  status: "Good" | "Bad";
};

const KOOT_MAX_POINTS: Array<{ name: string; max: number }> = [
  { name: "Varna", max: 1 },
  { name: "Vashya", max: 2 },
  { name: "Tara", max: 3 },
  { name: "Yoni", max: 4 },
  { name: "Graha Maitri", max: 5 },
  { name: "Gana", max: 6 },
  { name: "Bhakut", max: 7 },
  { name: "Nadi", max: 8 },
];

function hashSeed(input: string): number {
  return input.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function calculateMatch(boyDob: string, girlDob: string): {
  total: number;
  koots: KootResult[];
  compatibility: number;
  recommendation: string;
  mangalBoy: boolean;
  mangalGirl: boolean;
} {
  const baseSeed = hashSeed(`${boyDob}|${girlDob}`);
  const koots = KOOT_MAX_POINTS.map((koot, idx) => {
    const raw = (baseSeed + idx * 19) % (koot.max + 1);
    const score = Math.min(koot.max, Math.max(0, raw));
    return {
      name: koot.name,
      max: koot.max,
      score,
      status: score >= Math.ceil(koot.max / 2) ? "Good" : "Bad",
    } as KootResult;
  });

  const total = koots.reduce((sum, item) => sum + item.score, 0);
  const compatibility = Math.round((total / 36) * 100);
  const recommendation =
    total >= 26
      ? "Strong match. Marriage is highly recommended."
      : total >= 18
        ? "Moderate match. Marriage can work with mutual understanding."
        : "Below average match. Detailed guidance is recommended before marriage.";
  const mangalBoy = ((hashSeed(boyDob) + 7) % 5) < 2;
  const mangalGirl = ((hashSeed(girlDob) + 11) % 5) < 2;

  return { total, koots, compatibility, recommendation, mangalBoy, mangalGirl };
}

export default function KundliMatchClient() {
  const [boy, setBoy] = useState<PersonDetails>({
    name: "",
    dob: "",
    tob: "",
    place: "",
  });
  const [girl, setGirl] = useState<PersonDetails>({
    name: "",
    dob: "",
    tob: "",
    place: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(() => {
    return Boolean(
      boy.name &&
      boy.dob &&
      boy.tob &&
      boy.place &&
      girl.name &&
      girl.dob &&
      girl.tob &&
      girl.place
    );
  }, [boy, girl]);

  const result = useMemo(() => {
    if (!submitted || !boy.dob || !girl.dob) {
      return null;
    }
    return calculateMatch(boy.dob, girl.dob);
  }, [submitted, boy.dob, girl.dob]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-purple-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Kundli Matching
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Fill both birth details to get an Ashtakoot score, koot-wise analysis,
          and a quick marriage recommendation.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {[{ label: "Boy's details", state: boy, setState: setBoy }, { label: "Girl's details", state: girl, setState: setGirl }].map(
            (section) => (
              <section
                key={section.label}
                className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
              >
                <h2 className="text-lg font-bold text-violet-700">{section.label}</h2>
                <div className="mt-4 space-y-3">
                  <input
                    value={section.state.name}
                    onChange={(e) =>
                      section.setState((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Name"
                    className="w-full rounded-xl border border-violet-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <input
                    type="date"
                    value={section.state.dob}
                    onChange={(e) =>
                      section.setState((prev) => ({ ...prev, dob: e.target.value }))
                    }
                    className="w-full rounded-xl border border-violet-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <input
                    type="time"
                    value={section.state.tob}
                    onChange={(e) =>
                      section.setState((prev) => ({ ...prev, tob: e.target.value }))
                    }
                    className="w-full rounded-xl border border-violet-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
                  />
                  <input
                    value={section.state.place}
                    onChange={(e) =>
                      section.setState((prev) => ({ ...prev, place: e.target.value }))
                    }
                    placeholder="Place of Birth"
                    className="w-full rounded-xl border border-violet-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </div>
              </section>
            )
          )}
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => setSubmitted(true)}
          className="mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
        >
          Match Kundli
        </button>

        {result ? (
          <section className="mt-8 rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-violet-50 p-4">
                <p className="text-sm text-violet-700">Overall score</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {result.total} / 36
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-4">
                <p className="text-sm text-violet-700">Compatibility</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {result.compatibility}%
                </p>
              </div>
              <div className="rounded-xl bg-violet-50 p-4">
                <p className="text-sm text-violet-700">Recommendation</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {result.recommendation}
                </p>
              </div>
            </div>

            <h3 className="mt-6 text-lg font-bold text-slate-900">
              Ashtakoot Matching Table
            </h3>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-violet-100 text-violet-800">
                  <tr>
                    <th className="px-3 py-2">Koot</th>
                    <th className="px-3 py-2">Max</th>
                    <th className="px-3 py-2">Obtained</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.koots.map((koot) => (
                    <tr key={koot.name} className="border-b border-violet-50">
                      <td className="px-3 py-2">{koot.name}</td>
                      <td className="px-3 py-2">{koot.max}</td>
                      <td className="px-3 py-2">{koot.score}</td>
                      <td
                        className={`px-3 py-2 font-semibold ${
                          koot.status === "Good" ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {koot.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                <h4 className="font-semibold text-slate-900">
                  Boy&apos;s Mangal Dosha
                </h4>
                <p className="mt-1 text-sm text-slate-700">
                  {result.mangalBoy ? "Present" : "Not Present"}
                </p>
              </div>
              <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
                <h4 className="font-semibold text-slate-900">
                  Girl&apos;s Mangal Dosha
                </h4>
                <p className="mt-1 text-sm text-slate-700">
                  {result.mangalGirl ? "Present" : "Not Present"}
                </p>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
