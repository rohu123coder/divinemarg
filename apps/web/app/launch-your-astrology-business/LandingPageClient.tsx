"use client";

import { useEffect, useState } from "react";

import { trackGAEvent, trackMetaEvent } from "@/lib/tracking";

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

  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_name: "B2B Astrology Business Demo",
    });
    trackGAEvent("view_content", {
      content_name: "b2b_astrology_demo",
    });
  }, []);

  const handleOpenCheckout = (source: string) => {
    setCheckoutSource(source);
    setCheckoutOpen(true);
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
      </div>
    </DemoBookingProvider>
  );
}
