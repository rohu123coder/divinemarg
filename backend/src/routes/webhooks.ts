import { createHmac, timingSafeEqual } from "node:crypto";

import type { Request, Response } from "express";

import { query } from "../db/index.js";
import {
  sendAdminDemoBookingNotification,
  sendDemoBookingConfirmation,
} from "../lib/email.js";

type RazorpayWebhookBody = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        amount?: number;
        email?: string;
        contact?: string;
        notes?: Record<string, string>;
      };
    };
  };
};

function verifyWebhookSignature(rawBody: Buffer, signature: string | undefined): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function findLeadForPayment(entity: {
  notes?: Record<string, string>;
  email?: string;
  contact?: string;
}): Promise<{ id: string; name: string; email: string; phone: string; city: string; current_business: string | null; status: string } | null> {
  const leadIdFromNotes = entity.notes?.lead_id;
  if (leadIdFromNotes) {
    const byId = await query<{
      id: string;
      name: string;
      email: string;
      phone: string;
      city: string;
      current_business: string | null;
      status: string;
    }>(
      `SELECT id, name, email, phone, city, current_business, status
       FROM demo_booking_leads WHERE id = $1`,
      [leadIdFromNotes]
    );
    if (byId.rows[0]) return byId.rows[0];
  }

  const phone = entity.contact?.replace(/\D/g, "").slice(-10);
  const email = entity.email?.trim().toLowerCase();

  if (phone || email) {
    const byContact = await query<{
      id: string;
      name: string;
      email: string;
      phone: string;
      city: string;
      current_business: string | null;
      status: string;
    }>(
      `SELECT id, name, email, phone, city, current_business, status
       FROM demo_booking_leads
       WHERE status IN ('lead_only', 'pending', 'payment_failed')
         AND (
           ($1::text IS NOT NULL AND phone = $1)
           OR ($2::text IS NOT NULL AND LOWER(email) = $2)
         )
       ORDER BY created_at DESC
       LIMIT 1`,
      [phone ?? null, email ?? null]
    );
    if (byContact.rows[0]) return byContact.rows[0];
  }

  return null;
}

async function markLeadPaid(
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    current_business: string | null;
    status: string;
  },
  paymentId: string,
  amountPaise: number
): Promise<void> {
  if (lead.status === "paid") return;

  const amountPaid = amountPaise / 100;

  await query(
    `UPDATE demo_booking_leads
     SET status = 'paid',
         razorpay_payment_id = $1,
         amount_paid = $2,
         paid_at = now()
     WHERE id = $3`,
    [paymentId, amountPaid, lead.id]
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
}

export async function razorpayWebhookHandler(req: Request, res: Response): Promise<void> {
  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({ success: false, error: "Invalid body" });
    return;
  }

  const signature = req.headers["x-razorpay-signature"] as string | undefined;
  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(400).json({ success: false, error: "Invalid signature" });
    return;
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody.toString("utf8")) as RazorpayWebhookBody;
  } catch {
    res.status(400).json({ success: false, error: "Invalid JSON" });
    return;
  }

  const event = body.event;
  const entity = body.payload?.payment?.entity;

  if (!entity?.id) {
    res.json({ success: true, received: true });
    return;
  }

  try {
    if (event === "payment.captured") {
      const lead = await findLeadForPayment(entity);
      if (lead) {
        await markLeadPaid(lead, entity.id, entity.amount ?? 9900);
      }
    } else if (event === "payment.failed") {
      const lead = await findLeadForPayment(entity);
      if (lead && lead.status !== "paid") {
        await query(
          `UPDATE demo_booking_leads SET status = 'payment_failed' WHERE id = $1`,
          [lead.id]
        );
      }
    }
  } catch (err) {
    console.error("[Webhook] Razorpay handler error:", err);
    res.status(500).json({ success: false, error: "Webhook processing failed" });
    return;
  }

  res.json({ success: true });
}
