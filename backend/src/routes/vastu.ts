import multer from "multer";
import streamifier from "streamifier";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { query } from "../db/index.js";
import { cloudinary } from "../lib/cloudinary.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  analyzeVastuPhotos,
  applyVastuRules,
  buildVastuReport,
  calculateVastuScore,
  isValidPropertyType,
  VASTU_PROPERTY_TYPES,
} from "../services/vastuService.js";

const router = Router();

const vastuUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|webp)$/i.test(file.mimetype);
    cb(null, ok);
  },
});

function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

type VastuScanRow = {
  id: string;
  user_id: string;
  property_type: string;
  north_direction: string;
  photo_urls: unknown;
  overall_score: string;
  report: unknown;
  raw_analysis: unknown;
  created_at: Date;
};

function rejectAstrologer(req: Request, res: Response): boolean {
  if (req.user?.role === "astrologer") {
    res.status(403).json({
      success: false,
      error: "This feature is available for app users only",
    });
    return true;
  }
  return false;
}

function parseRoomLabels(raw: unknown): string[] {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((v) => (typeof v === "string" ? v : String(v)));
      }
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) {
    return raw.map((v) => (typeof v === "string" ? v : String(v)));
  }
  return [];
}

router.post(
  "/analyze",
  authMiddleware,
  vastuUpload.array("photos", 5),
  async (req: Request, res: Response) => {
    if (rejectAstrologer(req, res)) return;

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: "At least one photo is required" });
      return;
    }

    const propertyTypeRaw =
      typeof req.body?.propertyType === "string"
        ? req.body.propertyType.trim().toLowerCase()
        : "residential";

    if (!isValidPropertyType(propertyTypeRaw)) {
      res.status(400).json({
        success: false,
        error: `Invalid propertyType. Must be one of: ${VASTU_PROPERTY_TYPES.join(", ")}`,
      });
      return;
    }

    const northRaw = req.body?.northDirection;
    const northDirection = Number(northRaw);
    if (!Number.isFinite(northDirection) || northDirection < 0 || northDirection > 360) {
      res.status(400).json({
        success: false,
        error: "northDirection is required and must be a number between 0 and 360",
      });
      return;
    }

    const roomLabels = parseRoomLabels(req.body?.roomLabels);

    let photoUrls: Array<{ url: string; roomLabel: string; compassDirection: number }>;
    try {
      photoUrls = await Promise.all(
        files.map(async (file, index) => {
          const url = await uploadToCloudinary(file.buffer, "divinemarg/vastu");
          const compassRaw = req.body?.[`compassDirection_${index}`] ?? req.body?.compassDirection;
          const compassDirection = Number(compassRaw);
          return {
            url,
            roomLabel: roomLabels[index] ?? `Room ${index + 1}`,
            compassDirection: Number.isFinite(compassDirection) ? compassDirection : northDirection,
          };
        })
      );
    } catch (e) {
      console.error("[Vastu] Cloudinary upload failed:", e);
      res.status(500).json({ success: false, error: "Photo upload failed" });
      return;
    }

    try {
      const analysis = await analyzeVastuPhotos(photoUrls, propertyTypeRaw, northDirection);
      const appliedRules = applyVastuRules(analysis, propertyTypeRaw);
      const scores = calculateVastuScore(analysis, appliedRules);
      const report = buildVastuReport(scores, appliedRules, analysis, propertyTypeRaw);

      const insert = await query<VastuScanRow>(
        `INSERT INTO vastu_scans (
           user_id, property_type, north_direction, photo_urls,
           overall_score, report, raw_analysis
         )
         VALUES ($1, $2, $3, $4::jsonb, $5, $6::jsonb, $7::jsonb)
         RETURNING id, user_id, property_type, north_direction, photo_urls,
                   overall_score, report, raw_analysis, created_at`,
        [
          userId,
          propertyTypeRaw,
          northDirection,
          JSON.stringify(photoUrls),
          report.overallScore,
          JSON.stringify(report),
          JSON.stringify(analysis),
        ]
      );

      const row = insert.rows[0];
      if (!row) {
        res.status(500).json({ success: false, error: "Failed to save scan" });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: row.id,
          ...report,
          photoUrls,
          propertyType: propertyTypeRaw,
          northDirection,
          createdAt: row.created_at.toISOString(),
        },
      });
    } catch (e) {
      console.error("[Vastu] Analysis pipeline failed:", e);
      res.status(500).json({ success: false, error: "Vastu analysis failed" });
    }
  }
);

router.get("/history", authMiddleware, async (req: Request, res: Response) => {
  if (rejectAstrologer(req, res)) return;

  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  try {
    const result = await query<{
      id: string;
      created_at: Date;
      overall_score: string;
      property_type: string;
    }>(
      `SELECT id, created_at, overall_score, property_type
       FROM vastu_scans
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map((row) => ({
        id: row.id,
        createdAt: row.created_at.toISOString(),
        overallScore: Number(row.overall_score),
        propertyType: row.property_type,
      })),
    });
  } catch (e) {
    console.error("[Vastu] History fetch failed:", e);
    res.status(500).json({ success: false, error: "Failed to fetch scan history" });
  }
});

const idParamSchema = z.string().uuid();

router.get("/scan/:id", authMiddleware, async (req: Request, res: Response) => {
  if (rejectAstrologer(req, res)) return;

  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const parsedId = idParamSchema.safeParse(req.params.id);
  if (!parsedId.success) {
    res.status(400).json({ success: false, error: "Invalid scan id" });
    return;
  }

  try {
    const result = await query<VastuScanRow>(
      `SELECT id, user_id, property_type, north_direction, photo_urls,
              overall_score, report, raw_analysis, created_at
       FROM vastu_scans
       WHERE id = $1 AND user_id = $2`,
      [parsedId.data, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: "Scan not found" });
      return;
    }

    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.id,
        propertyType: row.property_type,
        northDirection: Number(row.north_direction),
        photoUrls: row.photo_urls,
        overallScore: Number(row.overall_score),
        report: row.report,
        rawAnalysis: row.raw_analysis,
        createdAt: row.created_at.toISOString(),
      },
    });
  } catch (e) {
    console.error("[Vastu] Get scan failed:", e);
    res.status(500).json({ success: false, error: "Failed to fetch scan" });
  }
});

export default router;
