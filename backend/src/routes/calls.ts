import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { pool } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { getSocketServer } from "../socket/io.js";

const router = Router();
router.use(authMiddleware);

const requestCallBody = z.object({
  astrologer_id: z.string().uuid(),
});

// POST /api/calls/request — User requests a voice call with astrologer
router.post("/request", async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const parsed = requestCallBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: "Invalid body" });
    return;
  }

  const { astrologer_id } = parsed.data;

  // Check astrologer exists and is available
  const astroResult = await pool.query<{
    id: string;
    user_id: string;
    price_per_minute: string;
    is_available: boolean;
    is_online: boolean;
  }>(
    `SELECT id, user_id, price_per_minute, is_available, is_online
     FROM astrologers WHERE id = $1`,
    [astrologer_id]
  );

  const astrologer = astroResult.rows[0];
  if (!astrologer) {
    res.status(404).json({ success: false, error: "Astrologer not found" });
    return;
  }

  if (!astrologer.is_available || !astrologer.is_online) {
    res.status(400).json({ success: false, error: "Astrologer is not available" });
    return;
  }

  // Check user wallet balance
  const walletResult = await pool.query<{ wallet_balance: string }>(
    `SELECT wallet_balance FROM users WHERE id = $1`,
    [userId]
  );
  const balance = Number(walletResult.rows[0]?.wallet_balance ?? 0);
  const pricePerMin = Number(astrologer.price_per_minute ?? 0);

  if (balance < pricePerMin) {
    res.status(400).json({ success: false, error: "Insufficient wallet balance" });
    return;
  }

  // Create a chat session with session_type = 'voice'
  const sessionResult = await pool.query<{ id: string }>(
    `INSERT INTO chat_sessions (user_id, astrologer_id, status, session_type)
     VALUES ($1, $2, 'waiting', 'voice')
     RETURNING id`,
    [userId, astrologer_id]
  );

  const sessionId = sessionResult.rows[0]?.id;
  if (!sessionId) {
    res.status(500).json({ success: false, error: "Could not create session" });
    return;
  }

  // Get user name for notification
  const userResult = await pool.query<{ name: string }>(
    `SELECT name FROM users WHERE id = $1`,
    [userId]
  );
  const userName = userResult.rows[0]?.name ?? "User";

  // Notify astrologer via socket
  try {
    const io = getSocketServer();
    console.log("[CALLS] Emitting incoming_call_request to user:", astrologer.user_id, "session:", sessionId);
    io.to(`user:${astrologer.user_id}`).emit("incoming_call_request", {
      sessionId,
      callType: "voice",
      callerName: userName,
      pricePerMinute: pricePerMin,
    });
  } catch (e) {
    console.error("Socket emit failed:", e);
  }

  res.json({
    success: true,
    data: {
      session_id: sessionId,
    },
  });
});

export { router as callsRouter };
