import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Refund Policy | DivineMarg",
  description:
    "Review DivineMarg wallet recharge and consultation refund rules, timelines, and refund request steps.",
};

const sections = [
  {
    id: "wallet-recharge",
    title: "1. Wallet Recharge Refunds",
    items: [
      "Unused wallet balance can be refunded within 7 days of recharge",
      "Partially used balance: only unused portion eligible",
      "Request via email: support@divinemarg.com with transaction ID",
    ],
  },
  {
    id: "consultation-charges",
    title: "2. Consultation Charges",
    items: [
      "Charges deducted during active sessions are non-refundable",
      "Exception: if technical error caused session to end unexpectedly, report within 24 hours",
    ],
  },
  {
    id: "refund-request",
    title: "3. How to Request Refund",
    items: [
      "Email: support@divinemarg.com",
      'Subject: "Refund Request - [Your Phone Number]"',
      "Include: transaction ID, date, amount, reason",
      "Processing time: 5-7 business days",
    ],
  },
  {
    id: "refund-method",
    title: "4. Refund Method",
    items: [
      "Refunded to original payment method",
      "UPI/Bank transfer: 3-5 business days",
      "Credit/Debit card: 5-7 business days",
    ],
  },
  {
    id: "non-refundable",
    title: "5. Non-Refundable Cases",
    items: [
      "Completed consultations",
      "Wallet balance used for sessions",
      "Bonus/promotional credits",
    ],
  },
] as const;

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-white text-slate-900">
      <Navbar />

      <main className="border-b border-slate-200">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h1 className="text-3xl font-extrabold text-[#7C3AED] md:text-4xl">Refund Policy</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            Our refund process is designed to be fair and transparent for wallet recharges and
            technical service issues.
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
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                    {section.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-[#B8960C]">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
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
