"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { createDemoBooking, type DemoBookingFormData } from "@/lib/leadCapture";
import { buildRazorpayPaymentPageUrl } from "@/lib/razorpayPaymentPage";
import { trackGAEvent, trackMetaEvent } from "@/lib/tracking";

type RazorpayCheckoutProps = {
  open: boolean;
  onClose: () => void;
  source: string;
};

const initialForm: DemoBookingFormData = {
  name: "",
  email: "",
  phone: "",
  city: "",
  currentBusiness: "",
};

const DEMO_VALUE = 99;
const DEMO_CURRENCY = "INR";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }
  return digits;
}

function validateForm(form: DemoBookingFormData): string | null {
  if (form.name.trim().length < 2) return "Please enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return "Please enter a valid email address";
  }
  const phone = normalizePhone(form.phone);
  if (!/^\d{10}$/.test(phone)) return "Phone must be exactly 10 digits";
  if (form.city.trim().length < 2) return "Please enter your city";
  return null;
}

export function RazorpayCheckout({ open, onClose, source }: RazorpayCheckoutProps) {
  const [form, setForm] = useState<DemoBookingFormData>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setForm(initialForm);
    setError(null);
    setWarning(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    trackMetaEvent("InitiateCheckout", { value: DEMO_VALUE, currency: DEMO_CURRENCY });
    trackGAEvent("begin_checkout", {
      value: DEMO_VALUE,
      currency: DEMO_CURRENCY,
      items: [{ item_name: "B2B Demo Booking" }],
    });
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const redirectToPaymentPage = (params: {
    name: string;
    email: string;
    phone: string;
    leadId?: string;
  }) => {
    const paymentUrl = buildRazorpayPaymentPageUrl(params);
    if (!paymentUrl) {
      setError("Payment page is not configured. Please contact support@divinemarg.com.");
      setLoading(false);
      return;
    }
    window.location.href = paymentUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setWarning(null);
    setLoading(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: normalizePhone(form.phone),
      city: form.city.trim(),
      currentBusiness: form.currentBusiness?.trim() || undefined,
      source,
    };

    let leadId: string | undefined;

    try {
      const result = await createDemoBooking(payload);
      leadId = result.lead_id;

      trackMetaEvent("Lead", {
        value: DEMO_VALUE,
        currency: DEMO_CURRENCY,
        content_name: "B2B Demo Booking",
      });
      trackGAEvent("generate_lead", {
        value: DEMO_VALUE,
        currency: DEMO_CURRENCY,
      });
    } catch {
      setWarning(
        "We could not save your details right now, but you can still continue to payment."
      );
    }

    /*
     * Custom Razorpay SDK checkout (uncomment when divinemarg.com account is approved):
     * Set NEXT_PUBLIC_USE_CUSTOM_CHECKOUT=true and restore loadRazorpayScript + verifyDemoBooking flow.
     *
     * if (process.env.NEXT_PUBLIC_USE_CUSTOM_CHECKOUT === 'true') { ... }
     */

    redirectToPaymentPage({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      leadId,
    });
  };

  const update = (field: keyof DemoBookingFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
            aria-label="Close booking form"
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="demo-booking-title"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gold-accent/30 bg-cosmic-deep p-6 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 text-cream-white/60 hover:text-cream-white"
              aria-label="Close"
            >
              <X size={22} />
            </button>

            <h2
              id="demo-booking-title"
              className="pr-8 font-heading text-2xl text-cream-white"
            >
              Book ₹99 Live Demo
            </h2>
            <p className="mt-2 font-sans text-sm text-cream-white/70">
              30-minute founder-led walkthrough. 100% refundable if no value.
            </p>

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
              <Field label="Full Name *" id="name">
                <input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  className="field-input"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </Field>
              <Field label="Email *" id="email">
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  className="field-input"
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </Field>
              <Field label="Phone (WhatsApp) *" id="phone">
                <input
                  id="phone"
                  type="tel"
                  required
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="field-input"
                  placeholder="10-digit mobile"
                  autoComplete="tel"
                />
              </Field>
              <Field label="City *" id="city">
                <input
                  id="city"
                  required
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className="field-input"
                  placeholder="Mumbai, Delhi, etc."
                  autoComplete="address-level2"
                />
              </Field>
              <Field label="Current Business (optional)" id="business">
                <textarea
                  id="business"
                  rows={3}
                  value={form.currentBusiness ?? ""}
                  onChange={(e) => update("currentBusiness", e.target.value)}
                  className="field-input resize-none"
                  placeholder="Astrologer on AstroTalk, Instagram tarot reader, etc."
                />
              </Field>

              {warning ? (
                <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                  {warning}
                </p>
              ) : null}

              {error ? (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-cta-gold py-4 font-semibold text-cosmic-deep shadow-gold-glow disabled:opacity-60"
              >
                {loading ? "Redirecting to payment…" : "Continue to Pay ₹99"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block font-sans text-sm text-cream-white/80">{label}</span>
      {children}
    </label>
  );
}
