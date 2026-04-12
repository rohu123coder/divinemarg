import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { pool, query } from "../db/index.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

const router = Router();

const jwtSecret = (): string => {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error("JWT_SECRET is not set");
  }
  return s;
};

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  const { email, password } = parsed.data;

  type AdminRow = {
    id: string;
    email: string;
    password_hash: string;
    role: string;
  };

  const result = await query<AdminRow>(
    `SELECT id, email, password_hash, role::text AS role
     FROM admins WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  const admin = result.rows[0];
  if (!admin) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { userId: admin.id, role: admin.role },
    jwtSecret(),
    { expiresIn: "7d" }
  );

  res.json({
    success: true,
    data: {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
    },
  });
});

router.use(authMiddleware);
router.use(requireAdmin);

const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

router.get("/stats", async (_req: Request, res: Response) => {
  const [usersCount, astrologersCount, revenueRow, sessionsCount] =
    await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM users`
      ).then((r) => Number(r.rows[0]?.count ?? 0)),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM astrologers`
      ).then((r) => Number(r.rows[0]?.count ?? 0)),
      query<{ sum: string | null }>(
        `SELECT COALESCE(SUM(amount), 0)::text AS sum
         FROM transactions
         WHERE type = 'recharge' AND status = 'success'`
      ).then((r) => Number(r.rows[0]?.sum ?? 0)),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM chat_sessions WHERE status = 'active'`
      ).then((r) => Number(r.rows[0]?.count ?? 0)),
    ]);

  res.json({
    success: true,
    data: {
      totalUsers: usersCount,
      totalAstrologers: astrologersCount,
      totalRevenue: revenueRow,
      activeSessions: sessionsCount,
    },
  });
});

const transactionsListQuery = paginationQuery.extend({
  limit: z.coerce.number().int().min(1).max(10000).default(20),
  status: z.enum(["pending", "success", "failed"]).optional(),
  type: z.enum(["recharge", "deduction", "refund"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

router.get("/transactions", async (req: Request, res: Response) => {
  const parsed = transactionsListQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid query",
    });
    return;
  }

  const { page, limit, status, type, from, to } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions: string[] = ["TRUE"];
  const params: unknown[] = [];
  let p = 1;

  if (status) {
    conditions.push(`t.status = $${p++}`);
    params.push(status);
  }
  if (type) {
    conditions.push(`t.type = $${p++}`);
    params.push(type);
  }
  if (from) {
    conditions.push(`t.created_at >= $${p++}::date`);
    params.push(from);
  }
  if (to) {
    conditions.push(`t.created_at < ($${p++}::date + interval '1 day')`);
    params.push(to);
  }

  const whereSql = conditions.join(" AND ");

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM transactions t
     INNER JOIN users u ON u.id = t.user_id
     WHERE ${whereSql}`,
    params
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const listParams = [...params, limit, offset];
  const limIdx = p++;
  const offIdx = p;

  const result = await query<{
    id: string;
    user_id: string;
    user_phone: string;
    type: string;
    amount: string;
    razorpay_order_id: string | null;
    razorpay_payment_id: string | null;
    status: string;
    created_at: Date;
  }>(
    `SELECT
       t.id,
       t.user_id,
       u.phone AS user_phone,
       t.type::text AS type,
       t.amount::text AS amount,
       t.razorpay_order_id,
       t.razorpay_payment_id,
       t.status::text AS status,
       t.created_at
     FROM transactions t
     INNER JOIN users u ON u.id = t.user_id
     WHERE ${whereSql}
     ORDER BY t.created_at DESC
     LIMIT $${limIdx} OFFSET $${offIdx}`,
    listParams
  );

  res.json({
    success: true,
    data: {
      transactions: result.rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        user_phone: row.user_phone,
        type: row.type,
        amount: Number(row.amount),
        razorpay_order_id: row.razorpay_order_id,
        razorpay_payment_id: row.razorpay_payment_id,
        status: row.status,
        created_at: row.created_at,
      })),
      page,
      limit,
      total,
    },
  });
});

const astrologersQuery = paginationQuery.extend({
  search: z.string().optional(),
});

router.get("/astrologers", async (req: Request, res: Response) => {
  const parsed = astrologersQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid query",
    });
    return;
  }

  const { page, limit, search } = parsed.data;
  const offset = (page - 1) * limit;

  const searchFilter = search
    ? `AND (u.name ILIKE $1 OR u.email ILIKE $1)`
    : "";
  const countParams = search ? [`%${search}%`] : [];
  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM astrologers a
     INNER JOIN users u ON u.id = a.user_id
     WHERE TRUE ${searchFilter}`,
    countParams
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const listFilter = search
    ? `AND (u.name ILIKE $1 OR u.email ILIKE $1)`
    : "";
  const listParams = search
    ? [`%${search}%`, limit, offset]
    : [limit, offset];
  const limitSql = search ? `LIMIT $2 OFFSET $3` : `LIMIT $1 OFFSET $2`;

  const result = await query<{
    id: string;
    user_id: string;
    rating: string | null;
    is_verified: boolean;
    is_available: boolean;
    user_name: string;
    user_email: string;
    user_phone: string;
    total_earnings: string;
  }>(
    `SELECT
       a.id,
       a.user_id,
       a.rating::text AS rating,
       a.is_verified,
       a.is_available,
       u.name AS user_name,
       u.email AS user_email,
       u.phone AS user_phone,
       COALESCE(e.sum_amount, 0)::text AS total_earnings
     FROM astrologers a
     INNER JOIN users u ON u.id = a.user_id
     LEFT JOIN (
       SELECT astrologer_id, SUM(amount) AS sum_amount
       FROM astrologer_earnings_log
       GROUP BY astrologer_id
     ) e ON e.astrologer_id = a.id
     WHERE TRUE ${listFilter}
     ORDER BY u.name ASC
     ${limitSql}`,
    listParams
  );

  res.json({
    success: true,
    data: {
      astrologers: result.rows.map((row) => ({
        id: row.id,
        user_id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        phone: row.user_phone,
        rating: row.rating != null ? Number(row.rating) : null,
        is_verified: row.is_verified,
        is_available: row.is_available,
        total_earnings: Number(row.total_earnings),
      })),
      page,
      limit,
      total,
    },
  });
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

router.post("/astrologers/:id/verify", async (req: Request, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid astrologer id",
    });
    return;
  }

  const { id } = parsed.data;
  const updated = await query<{ id: string }>(
    `UPDATE astrologers SET is_verified = true WHERE id = $1 RETURNING id`,
    [id]
  );

  if (!updated.rows[0]) {
    res.status(404).json({ success: false, error: "Astrologer not found" });
    return;
  }

  res.json({ success: true, data: { astrologerId: id, is_verified: true } });
});

router.post("/astrologers/:id/suspend", async (req: Request, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid astrologer id",
    });
    return;
  }

  const { id } = parsed.data;
  const updated = await query<{ id: string }>(
    `UPDATE astrologers
     SET is_verified = false, is_available = false
     WHERE id = $1
     RETURNING id`,
    [id]
  );

  if (!updated.rows[0]) {
    res.status(404).json({ success: false, error: "Astrologer not found" });
    return;
  }

  res.json({
    success: true,
    data: { astrologerId: id, is_verified: false, is_available: false },
  });
});

const usersQuery = paginationQuery.extend({
  search: z.string().optional(),
});

router.get("/users", async (req: Request, res: Response) => {
  const parsed = usersQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid query",
    });
    return;
  }

  const { page, limit, search } = parsed.data;
  const offset = (page - 1) * limit;

  const searchCond = search ? `AND u.phone ILIKE $1` : "";
  const searchParam = search ? [`%${search}%`] : [];

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM users u WHERE TRUE ${searchCond}`,
    searchParam
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const listSql = `SELECT
       u.id,
       u.name,
       u.phone,
       u.wallet_balance::text AS wallet_balance,
       u.is_suspended,
       u.created_at,
       COALESCE(s.spent, 0)::text AS total_spent
     FROM users u
     LEFT JOIN (
       SELECT user_id, SUM(amount) AS spent
       FROM transactions
       WHERE type = 'deduction' AND status = 'success'
       GROUP BY user_id
     ) s ON s.user_id = u.id
     WHERE TRUE ${searchCond}
     ORDER BY u.created_at DESC
     LIMIT $${search ? 2 : 1} OFFSET $${search ? 3 : 2}`;

  const listParams = search
    ? [`%${search}%`, limit, offset]
    : [limit, offset];

  const result = await query<{
    id: string;
    name: string;
    phone: string;
    wallet_balance: string;
    is_suspended: boolean;
    created_at: Date;
    total_spent: string;
  }>(listSql, listParams);

  res.json({
    success: true,
    data: {
      users: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        wallet_balance: Number(row.wallet_balance),
        total_spent: Number(row.total_spent),
        is_suspended: row.is_suspended,
        join_date: row.created_at,
      })),
      page,
      limit,
      total,
    },
  });
});

router.post("/users/:id/suspend", async (req: Request, res: Response) => {
  const parsed = idParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: "Invalid user id",
    });
    return;
  }

  const { id } = parsed.data;
  const updated = await query<{ id: string }>(
    `UPDATE users SET is_suspended = true WHERE id = $1 RETURNING id`,
    [id]
  );

  if (!updated.rows[0]) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  res.json({ success: true, data: { userId: id, is_suspended: true } });
});

router.get("/settings", async (_req: Request, res: Response) => {
  const result = await query<{ key: string; value: string | null }>(
    `SELECT key, value FROM platform_settings`
  );

  const settings: Record<string, string | null> = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }

  res.json({ success: true, data: { settings } });
});

const settingsPutBody = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.null()])
);

router.put("/settings", async (req: Request, res: Response) => {
  const parsed = settingsPutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  const entries = Object.entries(parsed.data).map(([key, value]) => [
    key,
    value === null || value === undefined ? null : String(value),
  ]) as [string, string | null][];

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const [key, value] of entries) {
      await client.query(
        `INSERT INTO platform_settings (key, value, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
        [key, value]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("admin settings update failed:", e);
    res.status(500).json({ success: false, error: "Could not save settings" });
    return;
  } finally {
    client.release();
  }

  const result = await query<{ key: string; value: string | null }>(
    `SELECT key, value FROM platform_settings`
  );

  const settings: Record<string, string | null> = {};
  for (const row of result.rows) {
    settings[row.key] = row.value;
  }

  res.json({ success: true, data: { settings } });
});

export { router as adminRouter };
