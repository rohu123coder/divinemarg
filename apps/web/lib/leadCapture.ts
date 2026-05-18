import api from "@/lib/api";

export type DemoBookingFormData = {
  name: string;
  email: string;
  phone: string;
  city: string;
  currentBusiness?: string;
};

export type DemoBookingLeadResponse = {
  lead_id: string;
};

export async function createDemoBooking(
  data: DemoBookingFormData & { source?: string }
): Promise<DemoBookingLeadResponse> {
  const res = await api.post("/api/leads/demo-booking", {
    ...data,
    amount: 99,
    status: "lead_only",
    source: data.source ?? "landing-page-b2b",
  });

  const d = res.data?.data as DemoBookingLeadResponse | undefined;
  if (!d?.lead_id) {
    throw new Error("Could not save demo booking lead");
  }
  return d;
}

/** @deprecated Use Razorpay Payment Page + webhook flow instead */
export async function verifyDemoBooking(payload: {
  leadId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<void> {
  await api.post("/api/leads/demo-booking/verify", {
    leadId: payload.leadId,
    razorpay_order_id: payload.razorpay_order_id,
    razorpay_payment_id: payload.razorpay_payment_id,
    razorpay_signature: payload.razorpay_signature,
  });
}
