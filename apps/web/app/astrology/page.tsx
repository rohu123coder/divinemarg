import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Vedic Astrology Guide | DivineMarg",
  description:
    "Learn what Vedic astrology is, planetary significations, house meanings, and useful astrology tools.",
};

const planetSignificance = [
  ["Sun", "Authority, confidence, vitality, father, and reputation."],
  ["Moon", "Mind, emotions, mother, comfort, and intuition."],
  ["Mars", "Energy, courage, action, siblings, and assertiveness."],
  ["Mercury", "Communication, intellect, trade, analytics, and logic."],
  ["Jupiter", "Wisdom, dharma, children, growth, and guidance."],
  ["Venus", "Love, luxury, art, comfort, and relationships."],
  ["Saturn", "Discipline, karma, delays, hard work, and justice."],
  ["Rahu", "Ambition, foreign influence, unconventional growth."],
  ["Ketu", "Detachment, spirituality, research, and inner awakening."],
];

const houseMeanings = [
  "1st: Self, personality, health, and life direction",
  "2nd: Wealth, speech, family, and stored values",
  "3rd: Courage, communication, siblings, and efforts",
  "4th: Home, mother, property, and emotional security",
  "5th: Intelligence, children, romance, and creativity",
  "6th: Disease, debt, competition, and service",
  "7th: Marriage, partnerships, and public dealings",
  "8th: Transformation, longevity, occult, and inheritance",
  "9th: Fortune, dharma, higher learning, and gurus",
  "10th: Career, status, karma, and profession",
  "11th: Gains, networks, ambitions, and elder siblings",
  "12th: Expenses, liberation, foreign lands, and sleep",
];

export default function AstrologyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-purple-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          What Is Vedic Astrology?
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700 sm:text-base">
          Vedic astrology (Jyotish) is an ancient Indian system that interprets
          planetary positions at birth to understand karma, tendencies, strengths,
          and timing of events. It uses rashis, nakshatras, houses, dashas, and
          transits to provide practical guidance.
        </p>

        <section className="mt-8 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Planets and Their Significance
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {planetSignificance.map(([planet, meaning]) => (
              <article key={planet} className="rounded-lg bg-violet-50 p-3">
                <p className="font-semibold text-violet-700">{planet}</p>
                <p className="mt-1 text-sm text-slate-700">{meaning}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Houses and Meanings</h2>
          <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            {houseMeanings.map((house) => (
              <li key={house} className="rounded-lg bg-violet-50 px-3 py-2">
                {house}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Explore Tools</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link className="rounded-full bg-violet-100 px-4 py-2 text-violet-700" href="/kundli">
              Free Kundli
            </Link>
            <Link className="rounded-full bg-violet-100 px-4 py-2 text-violet-700" href="/kundli/match">
              Kundli Matching
            </Link>
            <Link className="rounded-full bg-violet-100 px-4 py-2 text-violet-700" href="/panchang">
              Today&apos;s Panchang
            </Link>
            <Link className="rounded-full bg-violet-100 px-4 py-2 text-violet-700" href="/numerology">
              Numerology
            </Link>
            <Link className="rounded-full bg-violet-100 px-4 py-2 text-violet-700" href="/remedies">
              Remedies
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
