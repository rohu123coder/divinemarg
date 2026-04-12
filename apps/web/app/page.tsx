"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AstrologerCard } from "@/components/AstrologerCard";
import { Navbar } from "@/components/Navbar";
import api from "@/lib/api";

type Astro = {
  id: string;
  name: string;
  avatar_url: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  price_per_minute: number | null;
  is_available: boolean;
  experience_years: number | null;
};

const testimonials = [
  {
    name: "Priya S.",
    text: "Incredibly accurate reading. The astrologer was kind and clarified my career doubts in minutes.",
    rating: 5,
  },
  {
    name: "Arjun M.",
    text: "Smooth chat experience and fair pricing. I keep my wallet topped up for quick sessions.",
    rating: 5,
  },
  {
    name: "Neha R.",
    text: "Loved the instant connect. Felt personal, not like a generic app.",
    rating: 4,
  },
];

export default function HomePage() {
  const [featured, setFeatured] = useState<Astro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/astrologers`, { params: { limit: 6 } });
        const list = res.data?.data?.astrologers as Astro[] | undefined;
        if (!cancelled && list) {
          setFeatured(list);
        }
      } catch {
        if (!cancelled) {
          setFeatured([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-purple-100/80 via-indigo-50 to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-64 w-64 rounded-full bg-violet-300/30 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Get Answers From India&apos;s Best Astrologers
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Private, real-time chat. Add money to your wallet once and connect
            with verified experts for guidance on love, career, and more.
          </p>
          <Link
            href="/astrologers"
            className="mt-10 inline-flex rounded-full bg-gradient-to-r from-purple-600 to-orange-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg transition hover:opacity-95"
          >
            Talk to Astrologer
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          How it Works
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Create Account",
              desc: "Sign in with your mobile number in under a minute.",
              icon: "👤",
            },
            {
              step: "2",
              title: "Add Money to Wallet",
              desc: "Recharge securely with UPI or cards via Razorpay.",
              icon: "💳",
            },
            {
              step: "3",
              title: "Chat with Astrologer",
              desc: "Pick an available expert and start a live session instantly.",
              icon: "💬",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border border-slate-100 bg-slate-50/80 p-6 text-center shadow-sm"
            >
              <div className="text-4xl">{item.icon}</div>
              <div className="mt-2 text-sm font-bold text-violet-600">
                Step {item.step}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-100 bg-slate-50/50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Featured astrologers
          </h2>
          {loading ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl bg-slate-200/80"
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((a) => (
                <AstrologerCard key={a.id} {...a} languages={a.languages} />
              ))}
            </div>
          )}
          <div className="mt-10 text-center">
            <Link
              href="/astrologers"
              className="font-semibold text-violet-600 hover:text-violet-800"
            >
              View all astrologers →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          What seekers say
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <blockquote
              key={t.name}
              className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <p className="text-amber-500">
                {"★".repeat(t.rating)}
                <span className="text-slate-300">
                  {"★".repeat(5 - t.rating)}
                </span>
              </p>
              <p className="mt-3 text-slate-700">&ldquo;{t.text}&rdquo;</p>
              <footer className="mt-4 text-sm font-semibold text-slate-900">
                — {t.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-900 py-12 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 sm:flex-row sm:justify-between sm:px-6">
          <div>
            <p className="text-lg font-bold text-white">✨ DivineMarg</p>
            <p className="mt-2 text-sm text-slate-400">
              Trusted conversations with verified astrologers.
            </p>
          </div>
          <div className="flex flex-wrap gap-6 text-sm">
            <Link href="/astrologers" className="hover:text-white">
              Astrologers
            </Link>
            <Link href="/login" className="hover:text-white">
              Login
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl px-4 text-center text-xs text-slate-500 sm:px-6">
          © {new Date().getFullYear()} DivineMarg. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
