import { Router } from "express";
import { z } from "zod";

import { pool } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { generateAgoraToken, generateChannelName } from "../services/agoraService.js";

const router = Router();
router.use(authMiddleware);

const rateSessionBodySchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().trim().max(2000).optional(),
});

router.get(
  "/:sessionId/context",
  async (req, res) => {
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

    const row = await pool.query<{
      astrologer_name: string;
      photo: string | null;
    }>(
      `SELECT u.name AS astrologer_name,
              COALESCE(NULLIF(TRIM(a.profile_photo_url), ''), NULLIF(TRIM(u.profile_photo_url), ''), u.avatar_url) AS photo
       FROM chat_sessions cs
       INNER JOIN astrologers a ON a.id = cs.astrologer_id
       INNER JOIN users u ON u.id = a.user_id
       WHERE cs.id = $1 AND cs.user_id = $2`,
      [sessionId, userId]
    );

    const data = row.rows[0];
    if (!data) {
      res.status(404).json({ success: false, error: "Session not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        astrologer_name: data.astrologer_name,
        profile_photo_url: data.photo,
      },
    });
  }
);

router.get(
  "/:sessionId/call-token",
  async (req, res) => {
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

    const typeParse = z.enum(["voice", "video"]).safeParse(req.query.type);
    const callType = typeParse.success ? typeParse.data : "voice";

    const sessionRow = await pool.query<{
      id: string;
      status: string;
      session_type: string | null;
      user_id: string;
      astrologer_user_id: string;
      price_per_minute: string | null;
    }>(
      `SELECT cs.id,
              cs.status,
              cs.session_type,
              cs.user_id,
              au.user_id AS astrologer_user_id,
              a.price_per_minute
       FROM chat_sessions cs
       INNER JOIN astrologers a ON a.id = cs.astrologer_id
       INNER JOIN users au ON au.id = a.user_id
       WHERE cs.id = $1`,
      [sessionId]
    );

    const row = sessionRow.rows[0];
    if (!row || row.status !== "active") {
      res.status(404).json({ success: false, error: "Session not active" });
      return;
    }

    const isUserCaller = row.user_id === userId;
    const isAstrologerCaller = row.astrologer_user_id === userId;
    if (!isUserCaller && !isAstrologerCaller) {
      res.status(403).json({ success: false, error: "Not a session participant" });
      return;
    }

    const uid = isUserCaller ? 1 : 2;
    const channelName = generateChannelName(sessionId);

    await pool.query(
      `UPDATE chat_sessions
       SET call_channel_name = $1
       WHERE id = $2`,
      [channelName, sessionId]
    );

    const token = generateAgoraToken(channelName, uid, "publisher");

    res.json({
      success: true,
      data: {
        appId: process.env.AGORA_APP_ID,
        channelName,
        token,
        uid,
        sessionType: row.session_type ?? callType,
      },
    });
  }
);

router.post("/:sessionId/rate", async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }
  if (req.user?.role === "astrologer") {
    res.status(403).json({
      success: false,
      error: "This action is only available to users",
    });
    return;
  }

  const idParse = z.string().uuid().safeParse(req.params.sessionId);
  if (!idParse.success) {
    res.status(400).json({ success: false, error: "Invalid session id" });
    return;
  }
  const sessionId = idParse.data;

  const bodyParse = rateSessionBodySchema.safeParse(req.body);
  if (!bodyParse.success) {
    res.status(400).json({
      success: false,
      error: bodyParse.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  const { rating, reviewText } = bodyParse.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const sessionResult = await client.query<{
      id: string;
      astrologer_id: string;
      user_id: string;
      rated_at: Date | null;
      status: string;
    }>(
      `SELECT id, astrologer_id, user_id, rated_at, status
       FROM chat_sessions
       WHERE id = $1
       FOR UPDATE`,
      [sessionId]
    );
    const session = sessionResult.rows[0];
    if (!session || session.user_id !== userId) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, error: "Session not found" });
      return;
    }
    if (session.status !== "ended") {
      await client.query("ROLLBACK");
      res.status(400).json({ success: false, error: "Session is not ended yet" });
      return;
    }
    if (session.rated_at) {
      await client.query("ROLLBACK");
      res.status(400).json({ success: false, error: "Session already rated" });
      return;
    }

    await client.query(
      `UPDATE chat_sessions
       SET rating = $1,
           review_text = $2,
           rated_at = NOW()
       WHERE id = $3`,
      [rating, reviewText?.trim() || null, sessionId]
    );

    await client.query(
      `UPDATE astrologers
       SET avg_rating = (
             SELECT AVG(cs.rating)
             FROM chat_sessions cs
             WHERE cs.astrologer_id = $1
               AND cs.rating IS NOT NULL
           ),
           total_reviews = (
             SELECT COUNT(*)
             FROM chat_sessions cs
             WHERE cs.astrologer_id = $1
               AND cs.rating IS NOT NULL
           )
       WHERE id = $1`,
      [session.astrologer_id]
    );

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("rate session failed:", err);
    res.status(500).json({ success: false, error: "Could not submit rating" });
  } finally {
    client.release();
  }
});

export { router as sessionsRouter };

