import api from "@/lib/api";

export type DemoBookingFormData = {
  name: string;
  email: string;
  phone: string;
  city: string;
  currentBusiness?: string;
};

export type DemoBookingOrderResponse = {
  leadId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
};

export async function createDemoBooking(
  data: DemoBookingFormData
): Promise<DemoBookingOrderResponse> {
  const res = await api.post("/api/leads/demo-booking", {
    ...data,
    amount: 99,
    source: "landing-page-b2b",
  });

  const d = res.data?.data as DemoBookingOrderResponse | undefined;
  if (!d?.orderId || !d.keyId || !d.leadId) {
    throw new Error("Could not create demo booking order");
  }
  return d;
}

export async function verifyDemoBooking(payload: {
  leadId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<void> {
  await api.post("/api/leads/demo-booking/verify", payload);
}
