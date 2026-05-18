"use client";

import { useState } from "react";

import { ComparisonTable } from "./components/ComparisonTable";
import { CursorTrail } from "./components/CursorTrail";
import { ExitIntentPopup } from "./components/ExitIntentPopup";
import { FAQ } from "./components/FAQ";
import { FeaturesGrid } from "./components/FeaturesGrid";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";
import { FounderStory } from "./components/FounderStory";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { Navbar } from "./components/Navbar";
import { PricingTransparency } from "./components/PricingTransparency";
import { ProblemSection } from "./components/ProblemSection";
import { ProductDemo } from "./components/ProductDemo";
import { RazorpayCheckout } from "./components/RazorpayCheckout";
import { SalesNotificationPopup } from "./components/SalesNotificationPopup";
import { SolutionShowcase } from "./components/SolutionShowcase";
import { StickyMobileCTA } from "./components/StickyMobileCTA";
import { Testimonials } from "./components/Testimonials";
import { TrustBar } from "./components/TrustBar";
import { DemoBookingProvider } from "./lib/DemoBookingContext";

export function LandingPageClient() {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutSource, setCheckoutSource] = useState("landing-cta");

  const handleOpenCheckout = (source: string) => {
    setCheckoutSource(source);
    setCheckoutOpen(true);
    // Meta Pixel: fbq('track', 'InitiateCheckout');
    // GA4: gtag('event', 'demo_modal_opened');
  };

  return (
    <DemoBookingProvider onOpen={handleOpenCheckout}>
      <div className="landing-page min-h-screen bg-cosmic-deep text-cream-white">
        <CursorTrail />
        <Navbar />
        <main>
          <Hero />
          <TrustBar />
          <ProblemSection />
          <SolutionShowcase />
          <ComparisonTable />
          <FeaturesGrid />
          <ProductDemo />
          <FounderStory />
          <HowItWorks />
          <Testimonials />
          <PricingTransparency />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
        <SalesNotificationPopup />
        <ExitIntentPopup />
        <StickyMobileCTA />
        <RazorpayCheckout
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          source={checkoutSource}
        />

        {/* Tracking placeholders
        <Script id="meta-pixel" strategy="afterInteractive">{`...`}</Script>
        <Script id="ga4" strategy="afterInteractive">{`...`}</Script>
        */}
      </div>
    </DemoBookingProvider>
  );
}
