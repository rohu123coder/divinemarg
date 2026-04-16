import { Router } from "express";
import { z } from "zod";

import { pool } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";
import { generateAgoraToken, generateChannelName } from "../services/agoraService.js";

const router = Router();
router.use(authMiddleware);

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

export { router as sessionsRouter };

