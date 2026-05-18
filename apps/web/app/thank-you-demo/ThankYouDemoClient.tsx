"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { trackGAEvent, trackMetaEvent } from "@/lib/tracking";

const DEMO_VALUE = 99;
const DEMO_CURRENCY = "INR";

export function ThankYouDemoClient() {
  const searchParams = useSearchParams();
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const leadId =
      searchParams.get("lead_id") ??
      searchParams.get("leadId") ??
      searchParams.get("transaction_id") ??
      undefined;

    trackMetaEvent("Purchase", {
      value: DEMO_VALUE,
      currency: DEMO_CURRENCY,
    });

    trackGAEvent("purchase", {
      transaction_id: leadId,
      value: DEMO_VALUE,
      currency: DEMO_CURRENCY,
      items: [{ item_name: "B2B Demo Booking", price: DEMO_VALUE, quantity: 1 }],
    });
  }, [searchParams]);

  return null;
}
