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

const birthDetailsPatchBody = z
  .object({
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "dateOfBirth must be YYYY-MM-DD"),
    timeOfBirth: z.string().optional().nullable(),
    placeName: z.string().max(255).optional().nullable(),
    lat: z.coerce.number().finite(),
    lng: z.coerce.number().finite(),
    utcOffset: z.coerce.number().finite().optional(),
    gender: z.string().max(20).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    const t = val.timeOfBirth;
    if (t != null && String(t).trim() !== "") {
      if (!/^\d{1,2}:\d{2}$/.test(String(t).trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "timeOfBirth must be HH:MM when provided",
          path: ["timeOfBirth"],
        });
      }
    }
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

router.patch("/birth-details", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const parsed = birthDetailsPatchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  const {
    dateOfBirth,
    timeOfBirth,
    placeName,
    lat,
    lng,
    utcOffset,
    gender,
  } = parsed.data;

  const utc = utcOffset ?? 5.5;
  const tob =
    timeOfBirth != null && String(timeOfBirth).trim() !== ""
      ? String(timeOfBirth).trim()
      : null;

  try {
    await query(
      `UPDATE users SET
        date_of_birth = $1::date,
        time_of_birth = $2::time,
        birth_place_name = $3,
        birth_lat = $4,
        birth_lng = $5,
        birth_utc_offset = $6,
        gender = $7
       WHERE id = $8`,
      [
        dateOfBirth,
        tob,
        placeName ?? null,
        lat,
        lng,
        utc,
        gender?.trim() || null,
        userId,
      ]
    );

    res.json({ success: true, message: "Birth details updated" });
  } catch (e: unknown) {
    console.error("[Birth Details] Update error:", e);
    const msg = e instanceof Error ? e.message : "Update failed";
    res.status(500).json({ success: false, error: msg });
  }
});

router.get("/birth-details", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  try {
    const result = await query<{
      date_of_birth: Date | null;
      time_of_birth: string | null;
      birth_place_name: string | null;
      birth_lat: string | null;
      birth_lng: string | null;
      birth_utc_offset: string | null;
      gender: string | null;
    }>(
      `SELECT
        date_of_birth,
        time_of_birth,
        birth_place_name,
        birth_lat,
        birth_lng,
        birth_utc_offset,
        gender
       FROM users WHERE id = $1`,
      [userId]
    );

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    const dob =
      row.date_of_birth instanceof Date
        ? row.date_of_birth.toISOString().slice(0, 10)
        : row.date_of_birth
          ? String(row.date_of_birth).slice(0, 10)
          : null;

    const tobOut =
      row.time_of_birth != null
        ? String(row.time_of_birth).slice(0, 5)
        : null;

    res.json({
      success: true,
      hasDetails: !!dob,
      data: {
        dateOfBirth: dob,
        timeOfBirth: tobOut,
        placeName: row.birth_place_name,
        lat: row.birth_lat != null ? Number(row.birth_lat) : null,
        lng: row.birth_lng != null ? Number(row.birth_lng) : null,
        utcOffset:
          row.birth_utc_offset != null
            ? Number(row.birth_utc_offset)
            : 5.5,
        gender: row.gender,
      },
    });
  } catch (e: unknown) {
    console.error("[Birth Details] Get error:", e);
    const msg = e instanceof Error ? e.message : "Failed to load birth details";
    res.status(500).json({ success: false, error: msg });
  }
});

export { router as usersRouter };
