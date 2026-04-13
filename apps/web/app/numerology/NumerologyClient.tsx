"use client";

import { useMemo, useState } from "react";

import { Navbar } from "@/components/Navbar";

const numberDescriptions: Record<number, string> = {
  1: "Leader energy, confidence, and initiative.",
  2: "Cooperative, sensitive, and relationship-oriented.",
  3: "Creative expression, communication, and optimism.",
  4: "Practical, disciplined, and system-focused.",
  5: "Freedom-loving, adaptive, and adventurous.",
  6: "Nurturing, responsible, and family-centric.",
  7: "Analytical, spiritual, and introspective.",
  8: "Ambitious, authoritative, and result-driven.",
  9: "Compassionate, wise, and humanitarian.",
};

const luckyMap: Record<number, { color: string; gemstone: string }> = {
  1: { color: "Gold", gemstone: "Ruby" },
  2: { color: "White", gemstone: "Pearl" },
  3: { color: "Yellow", gemstone: "Yellow Sapphire" },
  4: { color: "Blue", gemstone: "Hessonite" },
  5: { color: "Green", gemstone: "Emerald" },
  6: { color: "Pink", gemstone: "Diamond" },
  7: { color: "Sea Green", gemstone: "Cat's Eye" },
  8: { color: "Navy", gemstone: "Blue Sapphire" },
  9: { color: "Red", gemstone: "Red Coral" },
};

function reduceToSingleDigit(value: number): number {
  let n = value;
  while (n > 9) {
    n = n
      .toString()
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return Math.max(1, n);
}

function letterValue(ch: string): number {
  const code = ch.toUpperCase().charCodeAt(0);
  if (code < 65 || code > 90) {
    return 0;
  }
  return code - 64;
}

function sumLetters(name: string, mode: "all" | "vowels" | "consonants"): number {
  const vowels = new Set(["A", "E", "I", "O", "U"]);
  return name
    .toUpperCase()
    .split("")
    .reduce((sum, ch) => {
      const val = letterValue(ch);
      if (!val) {
        return sum;
      }
      const isVowel = vowels.has(ch);
      if (mode === "vowels" && !isVowel) {
        return sum;
      }
      if (mode === "consonants" && isVowel) {
        return sum;
      }
      return sum + val;
    }, 0);
}

export default function NumerologyClient() {
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!submitted || !fullName || !dob) {
      return null;
    }
    const lifePath = reduceToSingleDigit(
      dob.replace(/\D/g, "").split("").reduce((sum, d) => sum + Number(d), 0)
    );
    const destiny = reduceToSingleDigit(sumLetters(fullName, "all"));
    const soulUrge = reduceToSingleDigit(sumLetters(fullName, "vowels"));
    const personality = reduceToSingleDigit(sumLetters(fullName, "consonants"));
    return {
      lifePath,
      destiny,
      soulUrge,
      personality,
      luckyNumber: lifePath,
      luckyColor: luckyMap[lifePath].color,
      luckyGemstone: luckyMap[lifePath].gemstone,
    };
  }, [submitted, fullName, dob]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-purple-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Numerology Calculator
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your name and birth date to calculate core numerology numbers.
        </p>

        <section className="mt-6 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-xl border border-violet-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-violet-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <button
            type="button"
            disabled={!fullName || !dob}
            onClick={() => setSubmitted(true)}
            className="mt-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Calculate
          </button>
        </section>

        {result ? (
          <section className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Life Path Number", result.lifePath],
                ["Destiny Number", result.destiny],
                ["Soul Urge Number", result.soulUrge],
                ["Personality Number", result.personality],
              ].map(([label, value]) => (
                <article
                  key={label}
                  className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-violet-700">{label}</p>
                  <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
                </article>
              ))}
            </div>

            <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Lucky Indicators</h2>
              <p className="mt-2 text-sm text-slate-700">
                Lucky Number: <span className="font-semibold">{result.luckyNumber}</span>
              </p>
              <p className="text-sm text-slate-700">
                Lucky Color: <span className="font-semibold">{result.luckyColor}</span>
              </p>
              <p className="text-sm text-slate-700">
                Lucky Gemstone:{" "}
                <span className="font-semibold">{result.luckyGemstone}</span>
              </p>
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Number Meanings (1-9)</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(numberDescriptions).map(([num, desc]) => (
              <article key={num} className="rounded-lg bg-violet-50 p-3">
                <p className="font-semibold text-violet-700">Number {num}</p>
                <p className="mt-1 text-sm text-slate-700">{desc}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
