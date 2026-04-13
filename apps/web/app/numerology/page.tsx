import type { Metadata } from "next";

import NumerologyClient from "./NumerologyClient";

export const metadata: Metadata = {
  title: "Numerology Calculator | DivineMarg",
  description:
    "Calculate life path, destiny, soul urge, and personality numbers with lucky color and gemstone.",
};

export default function NumerologyPage() {
  return <NumerologyClient />;
}
