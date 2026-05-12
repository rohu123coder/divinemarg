import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { pool } from "../db/index.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

/**
 * POST /api/notifications/test-send
 * Direct test endpoint — phone number specify karke notification bhejo
 *
 * Body:
 *   - phone: string (e.g. "9699661788")
 *   - title: string (optional, default: "Test Notification")
 *   - body: string (optional, default: "Hello from DivineMarg!")
 *
 * NOTE: Yeh DEV/TEST endpoint hai. Production mein remove ya admin-only kar dena.
 * Registered before authMiddleware so Postman/curl can trigger without a JWT.
 */
router.post("/test-send", async (req: Request, res: Response) => {
  try {
    const { phone, title, body } = req.body as {
      phone?: string;
      title?: string;
      body?: string;
    };

    if (!phone || typeof phone !== "string") {
      res.status(400).json({ error: "phone is required" });
      return;
    }

    const userResult = await pool.query<{
      id: string;
      name: string;
      expo_push_token: string | null;
      push_enabled: boolean | null;
    }>(
      `SELECT id, name, expo_push_token, push_enabled
       FROM users WHERE phone = $1`,
      [phone]
    );

    if (!userResult.rows.length) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userResult.rows[0];

    if (!user.expo_push_token) {
      res.status(400).json({ error: "User has no push token registered" });
      return;
    }

    if (!user.push_enabled) {
      res.status(400).json({ error: "Push notifications disabled for user" });
      return;
    }

    const { sendPushNotification } = await import("../services/pushNotifications.js");

    const success = await sendPushNotification({
      userId: user.id,
      title: title || "🙏 DivineMarg Test",
      body: body || `Hello ${user.name}! Pehla push notification aa gaya! 🎉`,
      type: "promotional",
      channelId: "default",
      priority: "high",
      data: { test: true },
    });

    res.json({
      success,
      message: success ? "Notification sent!" : "Notification failed (check backend logs)",
      user: {
        id: user.id,
        name: user.name,
        phone: phone,
        token_preview: user.expo_push_token.substring(0, 40) + "...",
      },
    });
  } catch (error: unknown) {
    console.error("[Test Push] Error:", error);
    const message = error instanceof Error ? error.message : "Internal error";
    res.status(500).json({ error: message });
  }
});

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
