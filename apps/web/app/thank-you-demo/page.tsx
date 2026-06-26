import type { Metadata } from "next";

import { tenantPageTitle } from "@/lib/tenantBranding";
import Link from "next/link";
import { Suspense } from "react";

import { ThankYouDemoClient } from "./ThankYouDemoClient";

export const metadata: Metadata = {
  title: tenantPageTitle("Demo Booked"),
  description: "Your ₹99 live demo booking is confirmed.",
  robots: { index: false },
};

export default function ThankYouDemoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cosmic-deep px-4 text-center text-cream-white">
      <Suspense fallback={null}>
        <ThankYouDemoClient />
      </Suspense>
      <p className="text-5xl">✨</p>
      <h1 className="mt-4 text-3xl font-bold md:text-4xl">Booking Confirmed!</h1>
      <p className="mt-4 max-w-md text-lg text-cream-white/85">
        Aapko WhatsApp pe demo link mil jayega next 10 minutes mein. Agar kuch miss ho,
        email check karein ya support@divinemarg.com par likhein.
      </p>
      <Link
        href="/launch-your-astrology-business"
        className="mt-8 rounded-full bg-gradient-to-r from-gold-accent via-soft-gold to-mystic-pink px-8 py-3 font-semibold text-cosmic-deep"
      >
        Back to Landing Page
      </Link>
    </main>
  );
}
