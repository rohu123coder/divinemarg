"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type DemoBookingContextValue = {
  openCheckout: (source?: string) => void;
  checkoutSource: string;
};

const DemoBookingContext = createContext<DemoBookingContextValue | null>(null);

export function DemoBookingProvider({
  children,
  onOpen,
}: {
  children: React.ReactNode;
  onOpen: (source: string) => void;
}) {
  const [checkoutSource, setCheckoutSource] = useState("landing-cta");

  const openCheckout = useCallback(
    (source = "landing-cta") => {
      setCheckoutSource(source);
      onOpen(source);
    },
    [onOpen]
  );

  const value = useMemo(
    () => ({ openCheckout, checkoutSource }),
    [openCheckout, checkoutSource]
  );

  return (
    <DemoBookingContext.Provider value={value}>{children}</DemoBookingContext.Provider>
  );
}

export function useDemoBooking(): DemoBookingContextValue {
  const ctx = useContext(DemoBookingContext);
  if (!ctx) {
    throw new Error("useDemoBooking must be used within DemoBookingProvider");
  }
  return ctx;
}
