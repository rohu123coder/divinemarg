"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import {
  createDemoBooking,
  verifyDemoBooking,
  type DemoBookingFormData,
} from "@/lib/leadCapture";
import { loadRazorpayScript } from "@/lib/razorpay";

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

function validateForm(form: DemoBookingFormData): string | null {
  if (form.name.trim().length < 2) return "Please enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email";
  if (!/^\d{10,15}$/.test(form.phone.replace(/\D/g, ""))) return "Please enter a valid phone number";
  if (form.city.trim().length < 2) return "Please enter your city";
  return null;
}

export function RazorpayCheckout({ open, onClose, source }: RazorpayCheckoutProps) {
  const router = useRouter();
  const [form, setForm] = useState<DemoBookingFormData>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => {
    setForm(initialForm);
    setError(null);
    setLoading(false);
  }, []);

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // trackEvent('demo_form_submitted');
      const order = await createDemoBooking({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\D/g, ""),
        city: form.city.trim(),
        currentBusiness: form.currentBusiness?.trim() || undefined,
      });

      await loadRazorpayScript();
      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        throw new Error("Payment gateway unavailable");
      }

      // trackEvent('demo_payment_initiated');

      const rzp = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "DivineMarg",
        description: "₹99 Live Demo Booking",
        order_id: order.orderId,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: { source, lead_id: order.leadId },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          setLoading(true);
          try {
            await verifyDemoBooking({
              leadId: order.leadId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            // trackEvent('demo_payment_success');
            handleClose();
            router.push("/thank-you-demo");
          } catch (err: unknown) {
            const msg =
              err &&
              typeof err === "object" &&
              "response" in err &&
              err.response &&
              typeof err.response === "object" &&
              "data" in err.response &&
              err.response.data &&
              typeof err.response.data === "object" &&
              "error" in err.response.data
                ? String((err.response.data as { error?: string }).error)
                : "Payment verification failed. Contact support@divinemarg.com";
            setError(msg);
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      setLoading(false);
      rzp.open();
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "error" in err.response.data
          ? String((err.response.data as { error?: string }).error)
          : err instanceof Error
            ? err.message
            : "Could not start checkout. Please try again.";
      setError(msg);
      setLoading(false);
    }
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
                />
              </Field>
              <Field label="Phone (WhatsApp) *" id="phone">
                <input
                  id="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className="field-input"
                  placeholder="10-digit mobile"
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

              {error ? (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-cta-gold py-4 font-semibold text-cosmic-deep shadow-gold-glow disabled:opacity-60"
              >
                {loading ? "Processing…" : "Pay ₹99 & Confirm Demo"}
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
