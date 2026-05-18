import { createHmac, timingSafeEqual } from "node:crypto";

import Razorpay from "razorpay";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { query } from "../db/index.js";
import {
  sendAdminDemoBookingNotification,
  sendDemoBookingConfirmation,
} from "../lib/email.js";

const router = Router();

const DEMO_AMOUNT_INR = 99;
const DEMO_AMOUNT_PAISE = 9900;

function getRazorpay(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
  }
  return new Razorpay({ key_id, key_secret });
}

const demoBookingBody = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(10).max(15),
  city: z.string().min(2).max(80),
  currentBusiness: z.string().max(2000).optional(),
  amount: z.number().default(DEMO_AMOUNT_INR),
  source: z.string().default("landing-page-b2b"),
});

router.post("/demo-booking", async (req: Request, res: Response) => {
  const parsed = demoBookingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  const { name, email, phone, city, currentBusiness, source } = parsed.data;

  let rzp: Razorpay;
  try {
    rzp = getRazorpay();
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "Payment provider misconfigured" });
    return;
  }

  const leadResult = await query<{ id: string }>(
    `INSERT INTO demo_booking_leads (name, email, phone, city, current_business, amount, source, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
     RETURNING id`,
    [name, email, phone, city, currentBusiness ?? null, DEMO_AMOUNT_INR, source]
  );

  const leadId = leadResult.rows[0]?.id;
  if (!leadId) {
    res.status(500).json({ success: false, error: "Could not create lead" });
    return;
  }

  const receipt = `demo_${leadId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`.slice(
    0,
    40
  );

  let order: { id: string; amount: number; currency: string };
  try {
    order = (await rzp.orders.create({
      amount: DEMO_AMOUNT_PAISE,
      currency: "INR",
      receipt,
      notes: { lead_id: leadId, source },
    })) as { id: string; amount: number; currency: string };
  } catch (e) {
    console.error("Razorpay demo order failed:", e);
    res.status(502).json({ success: false, error: "Could not create payment order" });
    return;
  }

  await query(
    `UPDATE demo_booking_leads SET razorpay_order_id = $1 WHERE id = $2`,
    [order.id, leadId]
  );

  res.status(201).json({
    success: true,
    data: {
      leadId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

const verifyDemoBody = z.object({
  leadId: z.string().uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

router.post("/demo-booking/verify", async (req: Request, res: Response) => {
  const parsed = verifyDemoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  const { leadId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    parsed.data;

  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_secret) {
    res.status(500).json({ success: false, error: "Payment provider misconfigured" });
    return;
  }

  const expected = createHmac("sha256", key_secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(razorpay_signature, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(400).json({ success: false, error: "Invalid payment signature" });
    return;
  }

  const leadResult = await query<{
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    current_business: string | null;
    status: string;
    razorpay_order_id: string | null;
  }>(
    `SELECT id, name, email, phone, city, current_business, status, razorpay_order_id
     FROM demo_booking_leads WHERE id = $1`,
    [leadId]
  );

  const lead = leadResult.rows[0];
  if (!lead) {
    res.status(404).json({ success: false, error: "Lead not found" });
    return;
  }

  if (lead.razorpay_order_id !== razorpay_order_id) {
    res.status(400).json({ success: false, error: "Order mismatch" });
    return;
  }

  if (lead.status === "paid") {
    res.json({ success: true, data: { alreadyPaid: true } });
    return;
  }

  await query(
    `UPDATE demo_booking_leads
     SET status = 'paid',
         razorpay_payment_id = $1,
         paid_at = now()
     WHERE id = $2`,
    [razorpay_payment_id, leadId]
  );

  void sendDemoBookingConfirmation(lead.email, lead.name).catch((err) =>
    console.error("[Email] Demo confirmation failed:", err)
  );

  void sendAdminDemoBookingNotification({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    currentBusiness: lead.current_business,
    leadId: lead.id,
  }).catch((err) => console.error("[Email] Admin notification failed:", err));

  res.json({
    success: true,
    data: { leadId: lead.id, status: "paid" },
  });
});

export { router as leadsRouter };
