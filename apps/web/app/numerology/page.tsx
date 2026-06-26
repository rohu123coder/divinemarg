import type { Metadata } from "next";

import { tenantPageTitle } from "@/lib/tenantBranding";

import NumerologyClient from "./NumerologyClient";

export const metadata: Metadata = {
  title: tenantPageTitle("Numerology Calculator"),
  description:
    "Calculate life path, destiny, soul urge, and personality numbers with lucky color and gemstone.",
};

export default function NumerologyPage() {
  return <NumerologyClient />;
}
