import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Disclaimer | DivineMarg",
  description:
    "Read DivineMarg's legal disclaimer covering the scope of astrological guidance and user responsibility.",
};

const sections = [
  {
    id: "general",
    title: "1. General Disclaimer",
    content:
      "DivineMarg is an online platform that connects users with independent astrologers. The content provided on this platform is for entertainment and informational purposes only.",
  },
  {
    id: "professional-advice",
    title: "2. Not Professional Advice",
    intro: "Astrological readings are NOT a substitute for:",
    items: [
      "Medical advice (consult a doctor)",
      "Legal advice (consult a lawyer)",
      "Financial advice (consult a financial advisor)",
      "Mental health support (consult a mental health professional)",
    ],
  },
  {
    id: "guarantees",
    title: "3. No Guarantees",
    content:
      "DivineMarg does not guarantee the accuracy, completeness, or usefulness of any astrological reading. Results may vary.",
  },
  {
    id: "independent-astrologers",
    title: "4. Independent Astrologers",
    content:
      "Astrologers on DivineMarg are independent service providers. DivineMarg verifies credentials but is not responsible for individual readings.",
  },
  {
    id: "user-responsibility",
    title: "5. User Responsibility",
    content:
      "Users consult astrologers at their own discretion and risk. DivineMarg is not liable for any decisions made based on astrological readings.",
  },
  {
    id: "age-restriction",
    title: "6. Age Restriction",
    content: "This service is intended for users 18 years and older.",
  },
] as const;

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-white text-slate-900">
      <Navbar />

      <main className="border-b border-slate-200">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h1 className="text-3xl font-extrabold text-[#7C3AED] md:text-4xl">Disclaimer</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            Please read this disclaimer carefully before using DivineMarg services.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[260px_1fr]">
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 lg:sticky lg:top-24">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">On this page</p>
              <nav className="mt-3 space-y-2">
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-slate-700 transition hover:text-[#7C3AED]"
                  >
                    {section.title}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="space-y-6">
              {sections.map((section) => (
                <section
                  id={section.id}
                  key={section.id}
                  className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <h2 className="text-xl font-bold text-[#7C3AED]">{section.title}</h2>
                  {"content" in section ? (
                    <p className="mt-3 text-sm leading-7 text-slate-700">{section.content}</p>
                  ) : null}
                  {"intro" in section ? (
                    <p className="mt-3 text-sm leading-7 text-slate-700">{section.intro}</p>
                  ) : null}
                  {"items" in section ? (
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-[#B8960C]">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
