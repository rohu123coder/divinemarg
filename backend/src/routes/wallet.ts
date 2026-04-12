import { createHmac, timingSafeEqual } from "node:crypto";

import Razorpay from "razorpay";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { pool, query } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

function getRazorpay(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required");
  }
  return new Razorpay({ key_id, key_secret });
}

const createOrderBody = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default("INR"),
});

router.post("/create-order", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const parsed = createOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  let rzp: Razorpay;
  try {
    rzp = getRazorpay();
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "Payment provider misconfigured" });
    return;
  }

  const { amount, currency } = parsed.data;
  const amountPaise = Math.round(amount * 100);
  if (amountPaise < 100) {
    res.status(400).json({
      success: false,
      error: "Minimum recharge amount is 1 INR",
    });
    return;
  }

  const receipt = `rc_${userId.replace(/-/g, "").slice(0, 12)}_${Date.now()}`.slice(
    0,
    40
  );

  let order: { id: string; amount: number; currency: string };
  try {
    order = (await rzp.orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes: { user_id: userId },
    })) as { id: string; amount: number; currency: string };
  } catch (e) {
    console.error("Razorpay order failed:", e);
    res.status(502).json({ success: false, error: "Could not create payment order" });
    return;
  }

  await query(
    `INSERT INTO transactions (user_id, type, amount, razorpay_order_id, status)
     VALUES ($1, 'recharge', $2, $3, 'pending')`,
    [userId, amount, order.id]
  );

  res.status(201).json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

const verifyPaymentBody = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

router.post("/verify-payment", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const parsed = verifyPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
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

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const txResult = await client.query<{
      id: string;
      amount: string;
      status: string;
    }>(
      `SELECT id, amount, status FROM transactions
       WHERE razorpay_order_id = $1 AND user_id = $2
       FOR UPDATE`,
      [razorpay_order_id, userId]
    );

    const tx = txResult.rows[0];
    if (!tx) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, error: "Order not found" });
      return;
    }

    if (tx.status !== "pending") {
      await client.query("ROLLBACK");
      res.status(400).json({ success: false, error: "Order already processed" });
      return;
    }

    const creditAmount = Number(tx.amount);

    await client.query(
      `UPDATE users
       SET wallet_balance = wallet_balance + $1::numeric
       WHERE id = $2`,
      [creditAmount, userId]
    );

    await client.query(
      `UPDATE transactions
       SET status = 'success',
           razorpay_payment_id = $1
       WHERE id = $2`,
      [razorpay_payment_id, tx.id]
    );

    await client.query("COMMIT");

    const balResult = await query<{ wallet_balance: string }>(
      `SELECT wallet_balance FROM users WHERE id = $1`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        credited: creditAmount,
        wallet_balance: Number(balResult.rows[0]?.wallet_balance ?? 0),
      },
    });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("verify-payment transaction failed:", e);
    res.status(500).json({ success: false, error: "Could not complete payment" });
  } finally {
    client.release();
  }
});

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get("/transactions", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const parsed = transactionsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid query",
    });
    return;
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM transactions WHERE user_id = $1`,
    [userId]
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const result = await query<{
    id: string;
    type: string;
    amount: string;
    status: string;
    created_at: Date;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
  }>(
    `SELECT id, type, amount, status, created_at, razorpay_order_id, razorpay_payment_id
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  res.json({
    success: true,
    data: {
      transactions: result.rows.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      page,
      limit,
      total,
    },
  });
});

export { router as walletRouter };
