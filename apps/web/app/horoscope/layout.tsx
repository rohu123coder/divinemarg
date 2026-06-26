import type { Metadata } from "next";

import { tenantPageTitle } from "@/lib/tenantBranding";

export const metadata: Metadata = {
  title: tenantPageTitle(
    "Aaj Ka Rashifal 2026 | Daily Horoscope in Hindi & English"
  ),
  description:
    "Get your free daily horoscope in Hindi and English. Accurate Rashifal for all 12 zodiac signs. Love, career, health and finance predictions daily.",
  keywords: [
    "rashifal",
    "aaj ka rashifal",
    "daily horoscope",
    "horoscope today",
    "kundli",
    "rashi",
  ],
};

export default function HoroscopeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
