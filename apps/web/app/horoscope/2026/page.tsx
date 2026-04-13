import type { Metadata } from "next";

import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Horoscope 2026 - All Rashis | DivineMarg",
  description:
    "Read 2026 yearly horoscope predictions for all 12 rashis across career, love, health, and finance.",
};

const yearlyPredictions = [
  {
    rashi: "Mesh (Aries)",
    career: "Leadership opportunities grow in the second half of 2026.",
    love: "Clear communication improves long-term relationships.",
    health: "Watch stress and sleep cycles during peak work periods.",
    finance: "Steady gains through disciplined saving and fewer risks.",
  },
  {
    rashi: "Vrishabh (Taurus)",
    career: "Stable year for role expansion and skill upgrades.",
    love: "Emotional stability supports stronger commitment.",
    health: "Focus on digestive routine and consistent movement.",
    finance: "Property and long-term planning bring better returns.",
  },
  {
    rashi: "Mithun (Gemini)",
    career: "Networking and communication-heavy roles perform best.",
    love: "Travel or social events may trigger meaningful connections.",
    health: "Balance screen time and mental rest to avoid burnout.",
    finance: "Multiple income streams can improve monthly flow.",
  },
  {
    rashi: "Kark (Cancer)",
    career: "Creative and people-focused projects get recognition.",
    love: "Family support strengthens relationship decisions.",
    health: "Hydration and emotional boundaries improve vitality.",
    finance: "Control impulse spending for better year-end savings.",
  },
  {
    rashi: "Singh (Leo)",
    career: "Authority and visibility increase in mid-year quarters.",
    love: "Romance improves with appreciation and patience.",
    health: "Heart health, posture, and stamina need regular care.",
    finance: "Career rewards improve cash flow after July.",
  },
  {
    rashi: "Kanya (Virgo)",
    career: "Analytical strengths create promotion opportunities.",
    love: "Practical approach helps resolve lingering misunderstandings.",
    health: "Routine and diet discipline keep energy stable.",
    finance: "Conservative investments perform better than speculation.",
  },
  {
    rashi: "Tula (Libra)",
    career: "Partnerships and collaborations lead to growth.",
    love: "Relationship harmony improves through better boundaries.",
    health: "Lower-back and hydration care stay important.",
    finance: "Balanced budgeting prevents avoidable fluctuations.",
  },
  {
    rashi: "Vrishchik (Scorpio)",
    career: "Research, strategy, and depth work bring progress.",
    love: "Intense emotions settle with honest conversations.",
    health: "Detox and rest cycles improve overall resilience.",
    finance: "Avoid over-leveraging; focus on debt reduction.",
  },
  {
    rashi: "Dhanu (Sagittarius)",
    career: "Teaching, consulting, and travel-related roles thrive.",
    love: "Shared values become central in relationship choices.",
    health: "Maintain consistency in exercise to prevent fatigue.",
    finance: "Strong year for planned growth and education expenses.",
  },
  {
    rashi: "Makar (Capricorn)",
    career: "Hard work converts into tangible authority and trust.",
    love: "Slow but stable progress in personal life.",
    health: "Joint and bone strength need preventive attention.",
    finance: "Long-term assets and retirement planning are favored.",
  },
  {
    rashi: "Kumbh (Aquarius)",
    career: "Innovation and tech-oriented projects rise strongly.",
    love: "Friendship-first bonds become more meaningful this year.",
    health: "Circulation and sleep quality require consistency.",
    finance: "Income growth comes from unique skill monetization.",
  },
  {
    rashi: "Meen (Pisces)",
    career: "Intuition and creativity attract the right opportunities.",
    love: "Romantic life deepens with emotional clarity.",
    health: "Protect immunity with stable routines and rest.",
    finance: "Good year for savings if emotional spending is controlled.",
  },
];

export default function Horoscope2026Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-purple-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Horoscope 2026
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Yearly predictions for all 12 rashis across career, love, health, and
          finance.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {yearlyPredictions.map((item) => (
            <article
              key={item.rashi}
              className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
            >
              <h2 className="text-xl font-bold text-violet-700">{item.rashi}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>
                  <span className="font-semibold text-slate-900">Career:</span>{" "}
                  {item.career}
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Love:</span>{" "}
                  {item.love}
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Health:</span>{" "}
                  {item.health}
                </li>
                <li>
                  <span className="font-semibold text-slate-900">Finance:</span>{" "}
                  {item.finance}
                </li>
              </ul>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
