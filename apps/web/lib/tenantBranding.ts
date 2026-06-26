import type { Metadata } from "next";

import { getTenant } from "@/lib/tenants";

export function tenantPageTitle(pageTitle: string): string {
  const { name } = getTenant();
  return pageTitle.includes(name) ? pageTitle : `${pageTitle} | ${name}`;
}

export function tenantRootMetadata(): Metadata {
  const tenant = getTenant();
  return {
    title: `${tenant.name} — ${tenant.tagline}`,
    icons: tenant.logo.imageUrl ? { icon: tenant.logo.imageUrl } : undefined,
    description: `Get answers from India’s best astrologers. Wallet-powered live chat on ${tenant.name}.`,
  };
}

export const themeColor = {
  cosmicDeep: "var(--cosmic-deep, #1A0B2E)",
  cosmicSecondary: "var(--cosmic-secondary, #2D1B4E)",
  goldAccent: "var(--gold-accent, #FFD700)",
  softGold: "var(--soft-gold, #F4C430)",
  mysticPink: "var(--mystic-pink, #FF6B9D)",
  violetElectric: "var(--violet-electric, #8B5CF6)",
  violetLight: "var(--violet-light, #A78BFA)",
  creamWhite: "var(--cream-white, #FFF8E7)",
  successGreen: "var(--success-green, #10B981)",
  violet50: "var(--violet-50, #f5f3ff)",
  violet100: "var(--violet-100, #ede9fe)",
  violet200: "var(--violet-200, #ddd6fe)",
  violet600: "var(--violet-600, #7c3aed)",
  violet700: "var(--violet-700, #6d28d9)",
  violet800: "var(--violet-800, #5b21b6)",
  violet900: "var(--violet-900, #4c1d95)",
} as const;
