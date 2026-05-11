import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { pool } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);

const expoTokenRegex = /^(ExponentPushToken|ExpoPushToken)\[/;

const registerTokenBody = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]).optional(),
});

const toggleBody = z.object({
  enabled: z.boolean(),
});

/**
 * POST /api/notifications/register-token
 */
router.post("/register-token", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parsed = registerTokenBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body",
      });
      return;
    }

    const { token, platform } = parsed.data;

    if (!expoTokenRegex.test(token)) {
      res.status(400).json({
        success: false,
        error: "Invalid Expo push token format. Expected ExponentPushToken[…] or ExpoPushToken[…]",
      });
      return;
    }

    const result = await pool.query<{
      id: string;
      name: string;
      push_platform: string | null;
      push_token_updated_at: Date | null;
    }>(
      `UPDATE users
       SET expo_push_token = $1,
           push_platform = $2,
           push_token_updated_at = NOW(),
           push_enabled = true
       WHERE id = $3
       RETURNING id, name, push_platform, push_token_updated_at`,
      [token, platform ?? null, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    console.log(`[Push] Token registered for user ${userId} (${platform ?? "unknown"})`);

    res.json({
      success: true,
      message: "Push token registered successfully",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("[Push] Register token error:", err);
    res.status(500).json({ success: false, error: "Failed to register push token" });
  }
});

/**
 * POST /api/notifications/unregister-token
 */
router.post("/unregister-token", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    await pool.query(
      `UPDATE users
       SET expo_push_token = NULL,
           push_enabled = false,
           push_token_updated_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    console.log(`[Push] Token unregistered for user ${userId}`);

    res.json({ success: true, message: "Push token unregistered" });
  } catch (err) {
    console.error("[Push] Unregister token error:", err);
    res.status(500).json({ success: false, error: "Failed to unregister push token" });
  }
});

/**
 * PATCH /api/notifications/toggle
 */
router.patch("/toggle", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parsed = toggleBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body",
      });
      return;
    }

    const { enabled } = parsed.data;

    await pool.query(`UPDATE users SET push_enabled = $1 WHERE id = $2`, [enabled, userId]);

    res.json({ success: true, push_enabled: enabled });
  } catch (err) {
    console.error("[Push] Toggle error:", err);
    res.status(500).json({ success: false, error: "Failed to toggle notifications" });
  }
});

export { router as notificationsRouter };
