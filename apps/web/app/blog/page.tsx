import type { Metadata } from "next";
import Link from "next/link";

import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getTenant } from "@/lib/tenants";

export function generateMetadata(): Metadata {
  const tenant = getTenant();
  return {
    title: `${tenant.name} Blog | Coming Soon`,
    description: `${tenant.name} blog with Vedic astrology insights, remedies, and guidance articles is coming soon.`,
  };
}

export default function BlogPage() {
  const tenant = getTenant();

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />

      <main className="border-b border-slate-200">
        <div className="mx-auto max-w-[1200px] px-4 py-16 text-center md:px-8 md:py-24">
          <h1 className="text-3xl font-extrabold text-violet-600 md:text-5xl">{tenant.name} Blog</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
            We are preparing valuable astrology content, practical remedies, and expert guidance
            articles for you.
          </p>
          <p className="mt-3 text-sm font-semibold text-[#B8960C]">Coming soon.</p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Back to Home
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
