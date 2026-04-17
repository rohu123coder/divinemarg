import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Contact Us | DivineMarg Support",
  description:
    "Get in touch with DivineMarg support for account help, payments, technical issues, and general inquiries.",
};

const contactCards = [
  {
    title: "Email Support",
    value: "support@divinemarg.com",
    detail: "We respond within 24 hours",
    icon: "📧",
    href: "mailto:support@divinemarg.com",
  },
  {
    title: "Live Chat",
    value: "Chat with our support team",
    detail: "Get help while browsing astrologers",
    icon: "💬",
    href: "/astrologers",
    cta: "Start Chat",
  },
  {
    title: "Facebook",
    value: "Connect with us on Facebook",
    detail: "Follow updates and announcements",
    icon: "📘",
    href: "https://www.facebook.com/DivineMargOfficial",
  },
  {
    title: "Support Hours",
    value: "Monday – Saturday: 9 AM – 8 PM IST",
    detail: "Sunday: 10 AM – 6 PM IST",
    icon: "⏰",
  },
] as const;

const faqs = [
  {
    question: "How do I recharge my wallet?",
    answer:
      "Go to your dashboard wallet section, choose a recharge amount, and complete payment securely via Razorpay.",
  },
  {
    question: "What if I'm not satisfied with a consultation?",
    answer:
      "Please share the issue with session details at support@divinemarg.com and our team will review it quickly.",
  },
  {
    question: "How are astrologers verified?",
    answer:
      "Every astrologer is manually reviewed before onboarding for experience, identity, and service quality standards.",
  },
  {
    question: "How do I report an issue?",
    answer:
      "Use this contact form or email support@divinemarg.com with your phone number, session ID, and issue details.",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main>
        <section className="border-b border-slate-200">
          <div className="mx-auto max-w-[1200px] px-4 py-14 md:px-8 md:py-16">
            <h1 className="text-3xl font-extrabold text-[#7C3AED] md:text-5xl">Contact Us</h1>
            <p className="mt-3 text-base text-slate-700 md:text-lg">We&apos;re here to help you</p>
          </div>
        </section>

        <section className="border-b border-slate-200">
          <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 md:grid-cols-2 md:px-8 md:py-16">
            <div className="space-y-4">
              {contactCards.map((card) => (
                <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{card.icon}</span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold text-[#7C3AED]">{card.title}</h2>
                      {card.href ? (
                        <Link
                          href={card.href}
                          target={card.href.startsWith("http") ? "_blank" : undefined}
                          rel={card.href.startsWith("http") ? "noreferrer" : undefined}
                          className="mt-1 block text-sm font-medium text-slate-800 hover:text-[#7C3AED]"
                        >
                          {card.value}
                        </Link>
                      ) : (
                        <p className="mt-1 text-sm font-medium text-slate-800">{card.value}</p>
                      )}
                      <p className="mt-1 text-sm text-slate-600">{card.detail}</p>
                      {card.cta ? (
                        <Link
                          href={card.href}
                          className="mt-4 inline-flex rounded-full bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-95"
                        >
                          {card.cta}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
              <h2 className="text-xl font-bold text-[#7C3AED]">Send us a message</h2>
              <form
                className="mt-5 space-y-4"
                action="mailto:support@divinemarg.com"
                method="POST"
                encType="text/plain"
              >
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
                    Phone (optional)
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
                    defaultValue="General Inquiry"
                  >
                    <option>General Inquiry</option>
                    <option>Technical Issue</option>
                    <option>Payment Issue</option>
                    <option>Astrologer Complaint</option>
                    <option>Partnership</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-700">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95 md:w-auto"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-8 md:py-16">
            <h2 className="text-2xl font-bold text-[#7C3AED] md:text-3xl">Frequently Asked Questions</h2>
            <div className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <details key={faq.question} className="rounded-xl border border-slate-200 bg-white p-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
