import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Terms and Conditions | DivineMarg",
  description:
    "Read DivineMarg terms for user eligibility, wallet payments, consultation rules, conduct, and legal disclaimers.",
};

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content:
      "By using DivineMarg, you agree to these Terms and Conditions. If you do not agree, please discontinue use of the platform.",
  },
  {
    id: "services",
    title: "2. Services Description",
    content:
      "DivineMarg provides a platform connecting users with astrologers for entertainment and guidance purposes.",
  },
  {
    id: "eligibility",
    title: "3. User Eligibility",
    content: "You must be 18 years or older to create an account and use DivineMarg services.",
  },
  {
    id: "registration",
    title: "4. Account Registration",
    content: "You must provide accurate information and maintain only one account per person.",
  },
  {
    id: "wallet-payments",
    title: "5. Wallet & Payments",
    items: [
      "Wallet must be recharged before starting consultations",
      "Minimum recharge: ₹100",
      "Payments processed via Razorpay",
    ],
  },
  {
    id: "consultation-rules",
    title: "6. Consultation Rules",
    items: [
      "Sessions are charged per minute as displayed on astrologer profile",
      'Session ends when either party clicks "End Session"',
      "No refund for completed sessions",
    ],
  },
  {
    id: "conduct",
    title: "7. User Conduct",
    content:
      "No abusive language, no sharing personal contact info, and no fraudulent activity are permitted on the platform.",
  },
  {
    id: "astrologer-content",
    title: "8. Astrologer Content",
    content:
      "Astrologers provide guidance for entertainment. This does not constitute medical, legal, or financial advice.",
  },
  {
    id: "disclaimer",
    title: "9. Disclaimer",
    content:
      "Astrology readings are for entertainment purposes. DivineMarg does not guarantee accuracy of predictions or outcomes.",
  },
  {
    id: "termination",
    title: "10. Termination",
    content: "We may suspend or terminate accounts that violate these terms or misuse the platform.",
  },
  {
    id: "law",
    title: "11. Governing Law",
    content: "These terms are governed by the laws of India, jurisdiction: courts of India.",
  },
  {
    id: "contact",
    title: "12. Contact",
    content: "support@divinemarg.com",
  },
] as const;

export default function TermsPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-white text-slate-900">
      <Navbar />

      <main className="border-b border-slate-200">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h1 className="text-3xl font-extrabold text-[#7C3AED] md:text-4xl">Terms and Conditions</h1>
          <p className="mt-3 text-sm text-slate-600">
            Please read these terms carefully before using DivineMarg.
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
