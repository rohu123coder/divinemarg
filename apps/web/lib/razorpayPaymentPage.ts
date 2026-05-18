export type RazorpayPaymentPagePrefill = {
  name: string;
  email: string;
  phone: string;
  leadId?: string;
};

/** Builds Razorpay Payment Page URL with prefill + lead_id in notes. */
export function buildRazorpayPaymentPageUrl(
  prefill: RazorpayPaymentPagePrefill
): string | null {
  const base = process.env.NEXT_PUBLIC_RAZORPAY_PAYMENT_PAGE_URL?.trim();
  if (!base) return null;

  try {
    const url = new URL(base);
    url.searchParams.set("prefill[name]", prefill.name);
    url.searchParams.set("prefill[email]", prefill.email);
    url.searchParams.set("prefill[contact]", prefill.phone);
    if (prefill.leadId) {
      url.searchParams.set("notes[lead_id]", prefill.leadId);
    }
    return url.toString();
  } catch {
    return null;
  }
}
