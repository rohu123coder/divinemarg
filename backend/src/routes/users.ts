import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { query } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

const profileUpdateBody = z.object({
  name: z.string().min(1).optional(),
  avatar_url: z.string().nullable().optional(),
});

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
  wallet_balance: string;
  created_at: Date;
};

function serializeUser(row: UserRow) {
  return {
    ...row,
    wallet_balance: Number(row.wallet_balance),
  };
}

router.get("/profile", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const result = await query<UserRow>(
    `SELECT id, name, email, phone, avatar_url, wallet_balance, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  const row = result.rows[0];
  if (!row) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  res.json({ success: true, data: { user: serializeUser(row) } });
});

router.put("/profile", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const parsed = profileUpdateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  const body = parsed.data;
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (body.name !== undefined) {
    sets.push(`name = $${i++}`);
    params.push(body.name);
  }
  if (body.avatar_url !== undefined) {
    sets.push(`avatar_url = $${i++}`);
    params.push(body.avatar_url);
  }

  if (sets.length === 0) {
    const existing = await query<UserRow>(
      `SELECT id, name, email, phone, avatar_url, wallet_balance, created_at
       FROM users WHERE id = $1`,
      [userId]
    );
    const row = existing.rows[0];
    if (!row) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({ success: true, data: { user: serializeUser(row) } });
    return;
  }

  params.push(userId);
  const whereParam = `$${i}`;
  const result = await query<UserRow>(
    `UPDATE users SET ${sets.join(", ")} WHERE id = ${whereParam}
     RETURNING id, name, email, phone, avatar_url, wallet_balance, created_at`,
    params
  );

  const row = result.rows[0];
  if (!row) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  res.json({ success: true, data: { user: serializeUser(row) } });
});

type TxRow = {
  id: string;
  type: string;
  amount: string;
  status: string;
  created_at: Date;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
};

router.get("/wallet", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const userResult = await query<{ wallet_balance: string }>(
    `SELECT wallet_balance FROM users WHERE id = $1`,
    [userId]
  );
  const u = userResult.rows[0];
  if (!u) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  const txResult = await query<TxRow>(
    `SELECT id, type, amount, status, created_at, razorpay_order_id, razorpay_payment_id
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 10`,
    [userId]
  );

  res.json({
    success: true,
    data: {
      balance: Number(u.wallet_balance),
      transactions: txResult.rows.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
    },
  });
});

export { router as usersRouter };
