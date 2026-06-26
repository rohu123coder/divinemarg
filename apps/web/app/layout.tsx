import type { Metadata } from "next";
import localFont from "next/font/local";
import { getTenant } from "@/lib/tenants";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "DivineMarg — Talk to India's Top Astrologers",
  icons: { icon: "/logo.png" },
  description:
    "Get answers from India’s best astrologers. Wallet-powered live chat on DivineMarg.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = getTenant();
  const { colors, gradients } = tenant.theme;

  const tenantThemeStyle = {
    "--cosmic-deep": colors.cosmicDeep,
    "--cosmic-secondary": colors.cosmicSecondary,
    "--gold-accent": colors.goldAccent,
    "--soft-gold": colors.softGold,
    "--mystic-pink": colors.mysticPink,
    "--violet-electric": colors.violetElectric,
    "--violet-light": colors.violetLight,
    "--cream-white": colors.creamWhite,
    "--success-green": colors.successGreen,
    "--hero-radial": gradients.heroRadial,
    "--cta-gold": gradients.ctaGold,
    "--card-highlight": gradients.cardHighlight,
  } as React.CSSProperties;

  return (
    <html lang="en" style={tenantThemeStyle}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}
