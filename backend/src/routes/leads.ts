import { createHmac, timingSafeEqual } from "node:crypto";

import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { query } from "../db/index.js";
import {
  sendAdminDemoBookingNotification,
  sendDemoBookingConfirmation,
} from "../lib/email.js";

const router = Router();

const DEMO_AMOUNT_INR = 99;

const demoBookingBody = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z
    .string()
    .transform((s) => s.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{10}$/, "Phone must be 10 digits")),
  city: z.string().min(2).max(80),
  currentBusiness: z.string().max(2000).optional(),
  amount: z.number().default(DEMO_AMOUNT_INR),
  source: z.string().default("landing-page-b2b"),
  status: z.enum(["lead_only", "pending", "paid"]).default("lead_only"),
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

  const { name, email, phone, city, currentBusiness, source, status } = parsed.data;

  const leadResult = await query<{ id: string }>(
    `INSERT INTO demo_booking_leads (name, email, phone, city, current_business, amount, source, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [name, email, phone, city, currentBusiness ?? null, DEMO_AMOUNT_INR, source, status]
  );

  const leadId = leadResult.rows[0]?.id;
  if (!leadId) {
    res.status(500).json({ success: false, error: "Could not create lead" });
    return;
  }

  res.status(201).json({
    success: true,
    data: {
      lead_id: leadId,
    },
  });
});

/** Legacy SDK checkout verify — kept for NEXT_PUBLIC_USE_CUSTOM_CHECKOUT */
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

  if (lead.razorpay_order_id && lead.razorpay_order_id !== razorpay_order_id) {
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
         razorpay_order_id = COALESCE(razorpay_order_id, $2),
         amount_paid = $3,
         paid_at = now()
     WHERE id = $4`,
    [razorpay_payment_id, razorpay_order_id, DEMO_AMOUNT_INR, leadId]
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
