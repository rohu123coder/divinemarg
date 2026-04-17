import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "DivineMarg Blog | Coming Soon",
  description:
    "DivineMarg blog with Vedic astrology insights, remedies, and guidance articles is coming soon.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main className="border-b border-slate-200">
        <div className="mx-auto max-w-[1200px] px-4 py-16 text-center md:px-8 md:py-24">
          <h1 className="text-3xl font-extrabold text-[#7C3AED] md:text-5xl">DivineMarg Blog</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
            We are preparing valuable astrology content, practical remedies, and expert guidance
            articles for you.
          </p>
          <p className="mt-3 text-sm font-semibold text-[#B8960C]">Coming soon.</p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
