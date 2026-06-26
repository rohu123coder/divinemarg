import type { Metadata } from "next";

import { tenantPageTitle } from "@/lib/tenantBranding";

import KundliMatchClient from "./KundliMatchClient";

export const metadata: Metadata = {
  title: tenantPageTitle("Kundli Matching - Ashtakoot Score"),
  description:
    "Check kundli compatibility with Ashtakoot score, koot-wise points, Mangal Dosha check, and marriage recommendation.",
};

export default function KundliMatchPage() {
  return <KundliMatchClient />;
}
