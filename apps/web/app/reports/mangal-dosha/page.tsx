import type { Metadata } from "next";

import MangalDoshaClient from "./MangalDoshaClient";

export const metadata: Metadata = {
  title: "Mangal Dosha Checker | DivineMarg",
  description:
    "Check Mangal Dosha presence and view practical remedies based on your birth details.",
};

export default function MangalDoshaPage() {
  return <MangalDoshaClient />;
}
