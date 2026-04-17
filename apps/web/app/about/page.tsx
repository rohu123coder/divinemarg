import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { FounderPhoto } from "@/components/FounderPhoto";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "About DivineMarg | Trusted Vedic Astrology Platform",
  description:
    "Learn the story behind DivineMarg, founded by Rohit Jha, and how we are building India’s most trusted platform for authentic Vedic astrology guidance.",
};

const missionCards = [
  {
    title: "Our Mission",
    text: "To make authentic Vedic astrology accessible to every Indian.",
  },
  {
    title: "Our Vision",
    text: "To be India's most trusted astrology platform.",
  },
  {
    title: "Our Values",
    text: "Transparency, Authenticity, Affordability.",
  },
];

const stats = [
  ["500+", "Consultations Done"],
  ["10+", "Verified Astrologers"],
  ["4.8★", "Average Rating"],
  ["100%", "Secure Payments"],
] as const;

const steps = [
  {
    title: "Choose your astrologer",
    text: "Browse verified astrologers, read reviews, and check rates.",
  },
  {
    title: "Start consultation",
    text: "Chat, voice, or video call instantly with the expert you trust.",
  },
  {
    title: "Get guidance",
    text: "Receive authentic Vedic insights for your life decisions.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main>
        <section className="border-b border-slate-200 bg-gradient-to-br from-violet-100 via-violet-50 to-white">
          <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8 md:py-20">
            <h1 className="text-3xl font-extrabold text-[#7C3AED] md:text-5xl">About DivineMarg</h1>
            <p className="mt-4 max-w-2xl text-base text-slate-700 md:text-lg">
              India&apos;s trusted platform for authentic Vedic astrology guidance
            </p>
          </div>
        </section>

        <section className="border-b border-slate-200">
          <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 md:grid-cols-[320px_1fr] md:px-8 md:py-16">
            <div className="flex justify-center md:justify-start">
              <FounderPhoto src="/rohit.jpg" alt="Rohit Jha, Founder of DivineMarg" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#7C3AED] md:text-3xl">The Story Behind DivineMarg</h2>
              <div className="mt-5 space-y-4 leading-7 text-slate-700">
                <p>
                  Growing up in a traditional Indian family, I — Rohit Jha — always believed in
                  the power of astrology. But finding genuine, trustworthy astrologers was always
                  a challenge. People were being misled, overcharged, and left without real
                  guidance.
                </p>
                <p>
                  That frustration became my mission. In 2024, I founded DivineMarg — which means
                  &quot;The Divine Path&quot; — with one simple goal: to connect every Indian with
                  authentic, verified astrologers at fair prices.
                </p>
                <p>
                  Today, DivineMarg is more than a platform. It is a movement — bringing ancient
                  Vedic wisdom to modern lives through technology, transparency, and trust.
                </p>
                <p>
                  Every astrologer on DivineMarg is manually verified. Every consultation is timed,
                  transparent, and fairly priced. Because everyone deserves genuine divine guidance.
                </p>
              </div>
              <p className="mt-6 text-sm font-semibold text-[#B8960C]">
                — Rohit Jha, Founder &amp; CEO, DivineMarg
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-16">
            <h2 className="text-2xl font-bold text-[#7C3AED] md:text-3xl">Mission &amp; Vision</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {missionCards.map((card) => (
                <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="text-lg font-bold text-[#7C3AED]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{card.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-16">
            <h2 className="text-2xl font-bold text-[#7C3AED] md:text-3xl">DivineMarg by Numbers</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              {stats.map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                  <p className="text-3xl font-extrabold text-[#B8960C]">{value}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-16">
            <h2 className="text-2xl font-bold text-[#7C3AED] md:text-3xl">How It Works</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <article key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#B8960C]">
                    Step {index + 1}
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
