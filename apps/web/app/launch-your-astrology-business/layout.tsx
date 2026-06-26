import type { Metadata } from "next";
import { Cormorant_Garamond, Plus_Jakarta_Sans, Inter } from "next/font/google";

import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import { getTenant } from "@/lib/tenants";

import { faqs } from "./lib/content";
import "./landing.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
  weight: ["400", "600", "700"],
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const tenant = getTenant();

export const metadata: Metadata = {
  title: `Launch Your Astrology Business in 30 Days | ${tenant.name}`,
  description:
    "Done-for-you astrology platform setup. Website, mobile app, payment, WhatsApp automation — sab ready. Book ₹99 live demo with founder.",
  keywords: [
    "start astrology business",
    "astrotalk like platform",
    "astrology app development",
    "white label astrology platform",
    "astrology business setup",
  ],
  openGraph: {
    title: "Launch Your Own Astrology Business — Bilkul AstroTalk Jaisa",
    description: "Apna platform, apne customers, 100% revenue. Book ₹99 live demo.",
    images: ["/landing-assets/og-image.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Launch Your Own Astrology Business | ${tenant.name}`,
    description: "Apna platform, apne customers, 100% revenue. Book ₹99 live demo.",
    images: ["/landing-assets/og-image.jpg"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: tenant.name,
      url: `https://${tenant.domain}`,
      logo: tenant.logo.imageUrl
        ? `https://${tenant.domain}${tenant.logo.imageUrl}`
        : `https://${tenant.domain}`,
      contactPoint: {
        "@type": "ContactPoint",
        email: tenant.contact.supportEmail,
        contactType: "customer support",
      },
    },
    {
      "@type": "Service",
      name: "Launch Your Own Astrology Business",
      provider: { "@type": "Organization", name: tenant.name },
      description:
        "Done-for-you astrology platform — website, mobile app, payments, WhatsApp automation in 30 days.",
      offers: {
        "@type": "Offer",
        price: "99",
        priceCurrency: "INR",
        name: "₹99 Live Demo",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ],
};

export default function LaunchLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${cormorant.variable} ${jakarta.variable} ${inter.variable}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
      <AnalyticsScripts />
    </div>
  );
}
