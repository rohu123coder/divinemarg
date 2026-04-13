import type { Metadata } from "next";

import KundliMatchClient from "./KundliMatchClient";

export const metadata: Metadata = {
  title: "Kundli Matching - Ashtakoot Score | DivineMarg",
  description:
    "Check kundli compatibility with Ashtakoot score, koot-wise points, Mangal Dosha check, and marriage recommendation.",
};

export default function KundliMatchPage() {
  return <KundliMatchClient />;
}
