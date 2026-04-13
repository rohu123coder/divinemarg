import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Free Astrology Reports | DivineMarg",
  description:
    "Access free astrology reports including Mangal Dosha, Sade Sati, Numerology, Lal Kitab, Varshphal, and Kaalsarp checks.",
};

const freeReports = [
  {
    title: "Mangal Dosha Report",
    description:
      "Check if Mangal Dosha is present in your chart and get practical remedies.",
    href: "/reports/mangal-dosha",
  },
  {
    title: "Sade Sati Report",
    description:
      "Understand your Saturn cycle phase and how it may affect life areas.",
    href: "/reports",
  },
  {
    title: "Numerology Report",
    description:
      "Get your core numbers and lucky elements based on name and date of birth.",
    href: "/numerology",
  },
  {
    title: "Lal Kitab Report",
    description: "Simple Lal Kitab based insights with remedy suggestions.",
    href: "/reports",
  },
  {
    title: "Varshphal / Annual Horoscope",
    description: "Yearly trend report with career, love, health, and finance focus.",
    href: "/horoscope/2026",
  },
  {
    title: "Kaalsarp Dosha",
    description: "Quick check for Kaalsarp dosha combinations and guidance.",
    href: "/reports",
  },
];

const paidReports = [
  "Detailed Marriage Compatibility Report",
  "Career & Business Growth Report",
  "Foreign Settlement & Travel Report",
  "Property & Wealth Timing Report",
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-purple-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
          Free Reports
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Explore instant free astrology reports and check key doshas and yearly
          trends.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {freeReports.map((report) => (
            <article
              key={report.title}
              className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-900">{report.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{report.description}</p>
              <Link
                href={report.href}
                className="mt-4 inline-flex rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Check Now
              </Link>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Paid Reports</h2>
          <p className="mt-2 text-sm text-slate-600">
            Need deeper insights? Premium reports are prepared by senior astrologers.
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            {paidReports.map((report) => (
              <li key={report} className="rounded-lg bg-violet-50 px-3 py-2">
                {report}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
