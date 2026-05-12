import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { query } from "../db/index.js";
import { authMiddleware, requireAstrologer } from "../middleware/auth.js";
import { calculateKundaliFromInput } from "./kundali.js";

const router = Router();

router.use(authMiddleware);
router.use(requireAstrologer);

const sessionIdSchema = z.string().uuid();

function formatDobForKundali(value: unknown): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function formatTimeForKundali(value: unknown): string | undefined {
  if (value == null) return undefined;
  const s = String(value).trim();
  if (s === "") return undefined;
  return s.length >= 5 ? s.slice(0, 5) : s;
}

/**
 * GET /api/astrologer/sessions/:sessionId/customer-kundli
 * Astrologer fetches customer kundali by session ID (must be the assigned astrologer).
 */
router.get(
  "/sessions/:sessionId/customer-kundli",
  async (req: Request, res: Response) => {
    const astrologerUserId = req.user?.userId;
    if (!astrologerUserId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parsedId = sessionIdSchema.safeParse(req.params.sessionId);
    if (!parsedId.success) {
      res.status(400).json({ success: false, error: "Invalid session id" });
      return;
    }
    const sessionId = parsedId.data;

    try {
      const sessionResult = await query<{
        user_id: string;
        astrologer_user_id: string;
        user_name: string;
        date_of_birth: Date | string | null;
        time_of_birth: string | null;
        birth_place_name: string | null;
        birth_lat: string | null;
        birth_lng: string | null;
        birth_utc_offset: string | null;
        gender: string | null;
      }>(
        `SELECT cs.user_id,
                a.user_id AS astrologer_user_id,
                u.name AS user_name,
                u.date_of_birth,
                u.time_of_birth,
                u.birth_place_name,
                u.birth_lat,
                u.birth_lng,
                u.birth_utc_offset,
                u.gender
         FROM chat_sessions cs
         JOIN users u ON u.id = cs.user_id
         JOIN astrologers a ON a.id = cs.astrologer_id
         WHERE cs.id = $1`,
        [sessionId]
      );

      if (sessionResult.rowCount === 0) {
        res.status(404).json({ success: false, error: "Session not found" });
        return;
      }

      const session = sessionResult.rows[0];

      if (session.astrologer_user_id !== astrologerUserId) {
        res.status(403).json({
          success: false,
          error: "Not authorized for this session",
        });
        return;
      }

      const dob = formatDobForKundali(session.date_of_birth);
      if (!dob) {
        res.json({
          success: true,
          hasDetails: false,
          message: "Customer has not provided birth details",
          customer: { name: session.user_name },
        });
        return;
      }

      const lat = Number(session.birth_lat);
      const lng = Number(session.birth_lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        res.status(400).json({
          success: false,
          error: "Customer birth coordinates are invalid or missing",
        });
        return;
      }

      const utcOffset =
        session.birth_utc_offset != null
          ? Number(session.birth_utc_offset)
          : 5.5;

      const kundaliData = calculateKundaliFromInput({
        dob,
        tob: formatTimeForKundali(session.time_of_birth),
        lat,
        lng,
        utcOffset: Number.isFinite(utcOffset) ? utcOffset : 5.5,
      });

      res.json({
        success: true,
        hasDetails: true,
        customer: {
          name: session.user_name,
          dateOfBirth: session.date_of_birth,
          timeOfBirth: session.time_of_birth,
          placeName: session.birth_place_name,
          gender: session.gender,
        },
        kundali: kundaliData,
      });
    } catch (e: unknown) {
      console.error("[Astrologer Kundali] Error:", e);
      const msg =
        e instanceof Error ? e.message : "Kundali calculation failed";
      res.status(500).json({ success: false, error: msg });
    }
  }
);

export { router as astrologerRouter };
