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
    ...(colors.violet50 && { "--violet-50": colors.violet50 }),
    ...(colors.violet100 && { "--violet-100": colors.violet100 }),
    ...(colors.violet200 && { "--violet-200": colors.violet200 }),
    ...(colors.violet300 && { "--violet-300": colors.violet300 }),
    ...(colors.violet400 && { "--violet-400": colors.violet400 }),
    ...(colors.violet500 && { "--violet-500": colors.violet500 }),
    ...(colors.violet600 && { "--violet-600": colors.violet600 }),
    ...(colors.violet700 && { "--violet-700": colors.violet700 }),
    ...(colors.violet800 && { "--violet-800": colors.violet800 }),
    ...(colors.violet900 && { "--violet-900": colors.violet900 }),
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
