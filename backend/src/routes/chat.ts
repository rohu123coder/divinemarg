import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { pool, query } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { getSocketServer } from "../socket/io.js";

const router = Router();

router.use(authMiddleware);

function requireUserRole(req: Request, res: Response, next: () => void): void {
  if (req.user?.role === "astrologer") {
    res.status(403).json({
      success: false,
      error: "This action is only available to users",
    });
    return;
  }
  next();
}

const chatRequestBody = z.object({
  astrologer_id: z.string().uuid(),
});

router.post(
  "/request",
  requireUserRole,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parsed = chatRequestBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body",
      });
      return;
    }

    const { astrologer_id } = parsed.data;

    const astroResult = await query<{
      id: string;
      price_per_minute: string | null;
      is_verified: boolean;
    }>(
      `SELECT id, price_per_minute, is_verified
       FROM astrologers WHERE id = $1`,
      [astrologer_id]
    );

    const astro = astroResult.rows[0];
    if (!astro || !astro.is_verified) {
      res.status(404).json({ success: false, error: "Astrologer not found" });
      return;
    }

    const activeSessionResult = await query<{ id: string }>(
      `SELECT id
       FROM chat_sessions
       WHERE astrologer_id = $1
         AND status = 'active'
       LIMIT 1`,
      [astrologer_id]
    );
    if (activeSessionResult.rows[0]) {
      const queueResult = await query<{ count: string }>(
        `SELECT COUNT(*)::text AS count
         FROM astrologer_waitlist
         WHERE astrologer_id = $1
           AND status = 'waiting'`,
        [astrologer_id]
      );
      const queueLength = Number(queueResult.rows[0]?.count ?? 0);
      res.status(409).json({
        success: false,
        error: "Astrologer is busy",
        data: {
          busy: true,
          astrologer_id,
          queue_length: queueLength,
        },
      });
      return;
    }

    const price = Number(astro.price_per_minute ?? 0);
    const minimumBalance = price * 5;

    const walletResult = await query<{ wallet_balance: string }>(
      `SELECT wallet_balance FROM users WHERE id = $1`,
      [userId]
    );
    const wallet = walletResult.rows[0];
    if (!wallet) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    if (Number(wallet.wallet_balance) < minimumBalance) {
      res.status(400).json({
        success: false,
        error: "Insufficient wallet balance for minimum chat duration",
        data: { required: minimumBalance, balance: Number(wallet.wallet_balance) },
      });
      return;
    }

    const sessionResult = await query<{ id: string }>(
      `INSERT INTO chat_sessions (user_id, astrologer_id, status, started_at)
       VALUES ($1, $2, 'waiting', now())
       RETURNING id`,
      [userId, astrologer_id]
    );

    const session = sessionResult.rows[0];
    if (!session) {
      res.status(500).json({ success: false, error: "Could not create session" });
      return;
    }

    const notifyResult = await query<{
      astrologer_user_id: string;
      user_name: string;
    }>(
      `SELECT a.user_id AS astrologer_user_id, u.name AS user_name
       FROM astrologers a
       INNER JOIN users u ON u.id = $2
       WHERE a.id = $1`,
      [astrologer_id, userId]
    );
    const notify = notifyResult.rows[0];
    if (notify) {
      try {
        getSocketServer()
          .to(`user:${notify.astrologer_user_id}`)
          .emit("incoming_request", {
            sessionId: session.id,
            userId,
            userName: notify.user_name,
          });
      } catch {
        // socket server not ready in tests
      }
    }

    res.status(201).json({
      success: true,
      data: { session_id: session.id },
    });
  }
);

router.post(
  "/end/:sessionId",
  requireUserRole,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const idParse = z.string().uuid().safeParse(req.params.sessionId);
    if (!idParse.success) {
      res.status(400).json({ success: false, error: "Invalid session id" });
      return;
    }
    const sessionId = idParse.data;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const lockResult = await client.query<{
        id: string;
        user_id: string;
        astrologer_id: string;
        status: string;
        started_at: Date | null;
        price_per_minute: string | null;
      }>(
        `SELECT cs.id, cs.user_id, cs.astrologer_id, cs.status, cs.started_at,
                a.price_per_minute
         FROM chat_sessions cs
         INNER JOIN astrologers a ON a.id = cs.astrologer_id
         WHERE cs.id = $1
         FOR UPDATE`,
        [sessionId]
      );

      const row = lockResult.rows[0];
      if (!row || row.user_id !== userId) {
        await client.query("ROLLBACK");
        res.status(404).json({ success: false, error: "Session not found" });
        return;
      }

      if (row.status === "ended") {
        await client.query("ROLLBACK");
        res.status(400).json({ success: false, error: "Session already ended" });
        return;
      }

      const price = Number(row.price_per_minute ?? 0);
      let totalMinutes = 0;
      if (row.started_at) {
        const ms = Date.now() - new Date(row.started_at).getTime();
        totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
      }

      const rawCharge = totalMinutes * price;
      const totalCharged = Math.round(rawCharge * 100) / 100;

      if (totalCharged > 0) {
        const deduct = await client.query<{ wallet_balance: string }>(
          `UPDATE users
           SET wallet_balance = wallet_balance - $1::numeric
           WHERE id = $2 AND wallet_balance >= $1::numeric
           RETURNING wallet_balance`,
          [totalCharged, userId]
        );
        if (deduct.rows.length === 0) {
          await client.query("ROLLBACK");
          res.status(400).json({
            success: false,
            error: "Insufficient wallet balance to cover session charges",
          });
          return;
        }

        await client.query(
          `INSERT INTO transactions (user_id, type, amount, status)
           VALUES ($1, 'deduction', $2, 'success')`,
          [userId, totalCharged]
        );

        await client.query(
          `INSERT INTO astrologer_earnings_log (astrologer_id, session_id, amount)
           VALUES ($1, $2, $3)`,
          [row.astrologer_id, sessionId, totalCharged]
        );
      }

      await client.query(
        `UPDATE chat_sessions
         SET status = 'ended',
             ended_at = now(),
             total_minutes = $1,
             total_charged = $2::numeric
         WHERE id = $3`,
        [totalMinutes, totalCharged, sessionId]
      );
      await client.query(
        `UPDATE astrologers
         SET avg_session_duration = (
           SELECT COALESCE(AVG(latest.total_minutes), 5)
           FROM (
             SELECT cs.total_minutes
             FROM chat_sessions cs
             WHERE cs.astrologer_id = $1
               AND cs.status = 'ended'
               AND cs.total_minutes > 0
             ORDER BY cs.started_at DESC NULLS LAST
             LIMIT 20
           ) latest
         )
         WHERE id = $1`,
        [row.astrologer_id]
      );

      await client.query("COMMIT");

      res.json({
        success: true,
        data: {
          session_id: sessionId,
          total_minutes: totalMinutes,
          total_charged: totalCharged,
        },
      });
    } catch (e) {
      await client.query("ROLLBACK");
      console.error("chat end transaction failed:", e);
      res.status(500).json({ success: false, error: "Could not end session" });
    } finally {
      client.release();
    }
  }
);

const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

router.get("/history", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const role = req.user?.role;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const parsed = historyQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid query",
    });
    return;
  }

  const { page, limit } = parsed.data;
  const offset = (page - 1) * limit;

  if (role === "astrologer") {
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM chat_sessions cs
       INNER JOIN astrologers a ON a.id = cs.astrologer_id
       WHERE a.user_id = $1 AND cs.status = 'ended'`,
      [userId]
    );
    const total = Number(countResult.rows[0]?.count ?? 0);

    const result = await query<{
      id: string;
      status: string;
      started_at: Date | null;
      ended_at: Date | null;
      total_minutes: number | null;
      total_charged: string | null;
      user_name: string;
    }>(
      `SELECT
         cs.id,
         cs.status,
         cs.started_at,
         cs.ended_at,
         cs.total_minutes,
         cs.total_charged,
         u.name AS user_name
       FROM chat_sessions cs
       INNER JOIN astrologers a ON a.id = cs.astrologer_id
       INNER JOIN users u ON u.id = cs.user_id
       WHERE a.user_id = $1 AND cs.status = 'ended'
       ORDER BY cs.ended_at DESC NULLS LAST, cs.started_at DESC NULLS LAST, cs.id DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: {
        sessions: result.rows.map((s) => ({
          ...s,
          total_charged:
            s.total_charged != null ? Number(s.total_charged) : null,
        })),
        page,
        limit,
        total,
      },
    });
    return;
  }

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM chat_sessions WHERE user_id = $1`,
    [userId]
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const result = await query<{
    id: string;
    astrologer_id: string;
    status: string;
    started_at: Date | null;
    ended_at: Date | null;
    total_minutes: number | null;
    total_charged: string | null;
    astrologer_name: string;
    astrologer_photo: string | null;
    rating: number | null;
    session_type: string | null;
  }>(
    `SELECT
       cs.id,
       cs.astrologer_id,
       cs.status,
       cs.started_at,
       cs.ended_at,
       cs.total_minutes,
       cs.total_charged,
       u.name AS astrologer_name,
       COALESCE(NULLIF(TRIM(a.profile_photo_url), ''), NULLIF(TRIM(u.profile_photo_url), ''), u.avatar_url) AS astrologer_photo,
       cs.rating,
       cs.session_type
     FROM chat_sessions cs
     INNER JOIN astrologers a ON a.id = cs.astrologer_id
     INNER JOIN users u ON u.id = a.user_id
     WHERE cs.user_id = $1
     ORDER BY cs.ended_at DESC NULLS LAST, cs.started_at DESC NULLS LAST, cs.id DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  res.json({
    success: true,
    data: {
      sessions: result.rows.map((s) => ({
        ...s,
        total_charged:
          s.total_charged != null ? Number(s.total_charged) : null,
        rating: s.rating != null ? Number(s.rating) : null,
      })),
      page,
      limit,
      total,
    },
  });
});

router.get("/history/:sessionId/messages", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const idParse = z.string().uuid().safeParse(req.params.sessionId);
  if (!idParse.success) {
    res.status(400).json({ success: false, error: "Invalid session id" });
    return;
  }
  const sessionId = idParse.data;

  const accessCheck = await query<{ id: string }>(
    `SELECT id
     FROM chat_sessions
     WHERE id = $1 AND user_id = $2
     LIMIT 1`,
    [sessionId, userId]
  );
  if (!accessCheck.rows[0]) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }

  const messagesResult = await query<{
    sender_role: "user" | "astrologer";
    content: string;
    created_at: Date;
  }>(
    `SELECT sender_role, content, created_at
     FROM session_messages_archive
     WHERE session_id = $1
     ORDER BY created_at ASC`,
    [sessionId]
  );

  res.json({
    success: true,
    data: {
      messages: messagesResult.rows.map((row) => ({
        sender_role: row.sender_role,
        content: row.content,
        created_at: row.created_at.toISOString(),
      })),
    },
  });
});

export { router as chatRouter };
