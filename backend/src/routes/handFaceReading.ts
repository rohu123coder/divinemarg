import multer from "multer";
import streamifier from "streamifier";
import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { query } from "../db/index.js";
import { cloudinary } from "../lib/cloudinary.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  buildReport,
  getVisionObservations,
  HAND_FACE_CATEGORIES,
  isValidHandFaceCategory,
} from "../services/handFaceReadingService.js";

const router = Router();

const readingUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
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

type ReadingRow = {
  id: string;
  user_id: string;
  category: string;
  palm_photo_url: string | null;
  face_photo_url: string | null;
  overview: string;
  samagri: string;
  vidhi: string;
  raw_observations: unknown;
  created_at: Date;
};

function mapReadingRow(row: ReadingRow) {
  return {
    id: row.id,
    category: row.category,
    overview: row.overview,
    samagri: row.samagri,
    vidhi: row.vidhi,
    palmPhotoUrl: row.palm_photo_url,
    facePhotoUrl: row.face_photo_url,
    createdAt: row.created_at.toISOString(),
  };
}

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

router.post(
  "/hand-face",
  authMiddleware,
  readingUpload.fields([
    { name: "palm", maxCount: 1 },
    { name: "face", maxCount: 1 },
  ]),
  async (req: Request, res: Response) => {
    if (rejectAstrologer(req, res)) return;

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const categoryRaw =
      typeof req.body?.category === "string" ? req.body.category.trim() : "";
    if (!categoryRaw) {
      res.status(400).json({ success: false, error: "category is required" });
      return;
    }
    if (!isValidHandFaceCategory(categoryRaw)) {
      res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${HAND_FACE_CATEGORIES.join(", ")}`,
      });
      return;
    }

    const files = req.files as
      | { palm?: Express.Multer.File[]; face?: Express.Multer.File[] }
      | undefined;
    const palmFile = files?.palm?.[0];
    const faceFile = files?.face?.[0];

    if (!palmFile && !faceFile) {
      res.status(400).json({
        success: false,
        error: "At least one image (palm or face) is required",
      });
      return;
    }

    let palmPhotoUrl: string | null = null;
    let facePhotoUrl: string | null = null;

    try {
      if (palmFile) {
        palmPhotoUrl = await uploadToCloudinary(
          palmFile.buffer,
          "divinemarg/readings"
        );
      }
      if (faceFile) {
        facePhotoUrl = await uploadToCloudinary(
          faceFile.buffer,
          "divinemarg/readings"
        );
      }
    } catch (e) {
      console.error("[HandFaceReading] Cloudinary upload failed:", e);
      res.status(500).json({ success: false, error: "Photo upload failed" });
      return;
    }

    const observations = await getVisionObservations({
      palmUrl: palmPhotoUrl ?? undefined,
      faceUrl: facePhotoUrl ?? undefined,
    });

    const report = buildReport(categoryRaw, observations);

    const rawObservations = {
      palm: observations.palmObservations
        ? JSON.parse(observations.palmObservations)
        : null,
      face: observations.faceObservations
        ? JSON.parse(observations.faceObservations)
        : null,
    };

    try {
      const insert = await query<ReadingRow>(
        `INSERT INTO palm_face_readings (
           user_id, category, palm_photo_url, face_photo_url,
           overview, samagri, vidhi, raw_observations
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
         RETURNING id, user_id, category, palm_photo_url, face_photo_url,
                   overview, samagri, vidhi, raw_observations, created_at`,
        [
          userId,
          categoryRaw,
          palmPhotoUrl,
          facePhotoUrl,
          report.overview,
          report.samagri,
          report.vidhi,
          JSON.stringify(rawObservations),
        ]
      );

      const row = insert.rows[0];
      if (!row) {
        res.status(500).json({ success: false, error: "Failed to save reading" });
        return;
      }

      res.status(201).json({
        success: true,
        data: mapReadingRow(row),
      });
    } catch (e) {
      console.error("[HandFaceReading] DB insert failed:", e);
      res.status(500).json({ success: false, error: "Failed to save reading" });
    }
  }
);

router.get("/hand-face", authMiddleware, async (req: Request, res: Response) => {
  if (rejectAstrologer(req, res)) return;

  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  try {
    const result = await query<ReadingRow>(
      `SELECT id, user_id, category, palm_photo_url, face_photo_url,
              overview, samagri, vidhi, raw_observations, created_at
       FROM palm_face_readings
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows.map(mapReadingRow),
    });
  } catch (e) {
    console.error("[HandFaceReading] List failed:", e);
    res.status(500).json({ success: false, error: "Failed to fetch readings" });
  }
});

const idParamSchema = z.string().uuid();

router.get(
  "/hand-face/:id",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (rejectAstrologer(req, res)) return;

    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parsedId = idParamSchema.safeParse(req.params.id);
    if (!parsedId.success) {
      res.status(400).json({ success: false, error: "Invalid reading id" });
      return;
    }

    try {
      const result = await query<ReadingRow>(
        `SELECT id, user_id, category, palm_photo_url, face_photo_url,
                overview, samagri, vidhi, raw_observations, created_at
         FROM palm_face_readings
         WHERE id = $1 AND user_id = $2`,
        [parsedId.data, userId]
      );

      if (result.rowCount === 0) {
        res.status(404).json({ success: false, error: "Reading not found" });
        return;
      }

      res.json({
        success: true,
        data: mapReadingRow(result.rows[0]),
      });
    } catch (e) {
      console.error("[HandFaceReading] Get by id failed:", e);
      res.status(500).json({ success: false, error: "Failed to fetch reading" });
    }
  }
);

export { router as handFaceReadingRouter };
