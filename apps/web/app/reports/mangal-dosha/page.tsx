import type { Metadata } from "next";

import { tenantPageTitle } from "@/lib/tenantBranding";

import MangalDoshaClient from "./MangalDoshaClient";

export const metadata: Metadata = {
  title: tenantPageTitle("Mangal Dosha Checker"),
  description:
    "Check Mangal Dosha presence and view practical remedies based on your birth details.",
};

export default function MangalDoshaPage() {
  return <MangalDoshaClient />;
}
