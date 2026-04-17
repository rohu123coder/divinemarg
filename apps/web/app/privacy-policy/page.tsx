import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | DivineMarg",
  description:
    "Read how DivineMarg collects, uses, and protects personal data across consultations, wallet payments, and platform operations.",
};

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content:
      'DivineMarg ("we", "us", "our") operates divinemarg.com. This policy explains how we collect, use, and protect your personal information.',
  },
  {
    id: "information-we-collect",
    title: "2. Information We Collect",
    items: [
      "Personal info: name, email, phone number",
      "Usage data: pages visited, features used",
      "Payment info: processed securely via Razorpay (we don't store card details)",
      "Chat/call logs: session summaries for quality assurance",
    ],
  },
  {
    id: "how-we-use-information",
    title: "3. How We Use Your Information",
    items: [
      "To provide astrology consultation services",
      "To process payments and maintain wallet balance",
      "To send service notifications (not marketing spam)",
      "To improve our platform",
    ],
  },
  {
    id: "information-sharing",
    title: "4. Information Sharing",
    items: [
      "We never sell your data to third parties",
      "Shared only with: payment processors (Razorpay), cloud services (necessary for operations)",
      "Astrologers see only your first name during consultations",
    ],
  },
  {
    id: "data-security",
    title: "5. Data Security",
    items: [
      "SSL encryption for all data transmission",
      "Secure payment processing via Razorpay",
      "Regular security audits",
    ],
  },
  {
    id: "your-rights",
    title: "6. Your Rights",
    items: [
      "Access your data: email support@divinemarg.com",
      "Delete your account: request via email",
      "Opt out of communications: unsubscribe link in emails",
    ],
  },
  {
    id: "cookies",
    title: "7. Cookies",
    items: [
      "We use cookies for login sessions and analytics",
      "You can disable cookies in browser settings",
    ],
  },
  {
    id: "contact",
    title: "8. Contact",
    content: "support@divinemarg.com",
  },
] as const;

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen scroll-smooth bg-white text-slate-900">
      <Navbar />

      <main className="border-b border-slate-200">
        <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
          <h1 className="text-3xl font-extrabold text-[#7C3AED] md:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-600">Last updated: April 2026</p>

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
