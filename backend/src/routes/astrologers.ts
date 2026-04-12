import { Router, type Request, type Response } from "express";
import { z } from "zod";

import { query } from "../db/index.js";
import {
  authMiddleware,
  optionalAuthMiddleware,
  requireAstrologer,
} from "../middleware/auth.js";

const router = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  specialization: z.string().trim().min(1).optional(),
  language: z.string().trim().min(1).optional(),
  sort: z
    .enum(["rating_desc", "rating_asc", "price_asc", "price_desc"])
    .default("rating_desc"),
});

type AstrologerListRow = {
  id: string;
  bio: string | null;
  specializations: string[];
  languages: string[];
  rating: string | null;
  total_reviews: number;
  price_per_minute: string | null;
  is_available: boolean;
  experience_years: number | null;
  name: string;
  avatar_url: string | null;
};

function listOrderClause(sort: z.infer<typeof listQuerySchema>["sort"]): string {
  switch (sort) {
    case "rating_asc":
      return "a.rating ASC NULLS LAST, a.id";
    case "price_asc":
      return "a.price_per_minute ASC NULLS LAST, a.id";
    case "price_desc":
      return "a.price_per_minute DESC NULLS LAST, a.id";
    case "rating_desc":
    default:
      return "a.rating DESC NULLS LAST, a.id";
  }
}

router.get("/", async (req: Request, res: Response) => {
  const parsed = listQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid query",
    });
    return;
  }

  const { page, limit, specialization, language, sort } = parsed.data;
  const offset = (page - 1) * limit;
  const orderBy = listOrderClause(sort);

  const conditions: string[] = ["a.is_verified = true"];
  const params: unknown[] = [];
  let p = 1;

  if (specialization) {
    conditions.push(`$${p} = ANY(a.specializations)`);
    params.push(specialization);
    p++;
  }
  if (language) {
    conditions.push(`$${p} = ANY(a.languages)`);
    params.push(language);
    p++;
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM astrologers a
     ${whereSql}`,
    params
  );
  const total = Number(countResult.rows[0]?.count ?? 0);

  const limitParam = p;
  const offsetParam = p + 1;
  const listParams = [...params, limit, offset];

  const result = await query<AstrologerListRow>(
    `SELECT
       a.id,
       a.bio,
       a.specializations,
       a.languages,
       a.rating,
       a.total_reviews,
       a.price_per_minute,
       a.is_available,
       a.experience_years,
       u.name,
       u.avatar_url
     FROM astrologers a
     INNER JOIN users u ON u.id = a.user_id
     ${whereSql}
     ORDER BY ${orderBy}
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    listParams
  );

  const astrologers = result.rows.map((row) => ({
    id: row.id,
    bio: row.bio,
    specializations: row.specializations,
    languages: row.languages,
    rating: row.rating != null ? Number(row.rating) : null,
    total_reviews: row.total_reviews,
    price_per_minute:
      row.price_per_minute != null ? Number(row.price_per_minute) : null,
    is_available: row.is_available,
    experience_years: row.experience_years,
    name: row.name,
    avatar_url: row.avatar_url,
  }));

  res.json({
    success: true,
    data: { astrologers, page, limit, total },
  });
});

router.get(
  "/dashboard",
  authMiddleware,
  requireAstrologer,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const aResult = await query<{
      id: string;
      rating: string | null;
      total_reviews: number;
      is_available: boolean;
    }>(
      `SELECT id, rating, total_reviews, is_available
       FROM astrologers WHERE user_id = $1`,
      [userId]
    );
    const astrologer = aResult.rows[0];
    if (!astrologer) {
      res.status(404).json({ success: false, error: "Astrologer not found" });
      return;
    }

    const earningsResult = await query<{ sum: string | null }>(
      `SELECT COALESCE(SUM(amount), 0)::text AS sum
       FROM astrologer_earnings_log
       WHERE astrologer_id = $1`,
      [astrologer.id]
    );

    const sessionsResult = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM chat_sessions
       WHERE astrologer_id = $1 AND status = 'ended'`,
      [astrologer.id]
    );

    const todayResult = await query<{ sum: string | null }>(
      `SELECT COALESCE(SUM(amount), 0)::text AS sum
       FROM astrologer_earnings_log
       WHERE astrologer_id = $1
         AND created_at >= date_trunc('day', CURRENT_TIMESTAMP)
         AND created_at < date_trunc('day', CURRENT_TIMESTAMP) + interval '1 day'`,
      [astrologer.id]
    );

    const monthResult = await query<{ sum: string | null }>(
      `SELECT COALESCE(SUM(amount), 0)::text AS sum
       FROM astrologer_earnings_log
       WHERE astrologer_id = $1
         AND created_at >= date_trunc('month', CURRENT_TIMESTAMP)
         AND created_at < date_trunc('month', CURRENT_TIMESTAMP) + interval '1 month'`,
      [astrologer.id]
    );

    const weekRows = await query<{ created_at: Date; amount: string }>(
      `SELECT created_at, amount::text AS amount
       FROM astrologer_earnings_log
       WHERE astrologer_id = $1 AND created_at >= now() - interval '8 days'`,
      [astrologer.id]
    );

    const byDay = new Map<string, number>();
    for (const row of weekRows.rows) {
      const key = new Date(row.created_at).toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + Number(row.amount));
    }
    const last7: Array<{ date: string; amount: number }> = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - i
        )
      );
      const key = d.toISOString().slice(0, 10);
      last7.push({ date: key, amount: byDay.get(key) ?? 0 });
    }

    res.json({
      success: true,
      data: {
        earnings_total: Number(earningsResult.rows[0]?.sum ?? 0),
        earnings_today: Number(todayResult.rows[0]?.sum ?? 0),
        earnings_this_month: Number(monthResult.rows[0]?.sum ?? 0),
        total_sessions: Number(sessionsResult.rows[0]?.count ?? 0),
        rating:
          astrologer.rating != null ? Number(astrologer.rating) : null,
        total_reviews: astrologer.total_reviews,
        last_7_days_earnings: last7,
        is_available: astrologer.is_available,
      },
    });
  }
);

const profileUpdateBody = z.object({
  bio: z.string().nullable().optional(),
  specializations: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  price_per_minute: z.number().nonnegative().optional(),
  experience_years: z.number().int().nonnegative().nullable().optional(),
});

router.put(
  "/profile",
  authMiddleware,
  requireAstrologer,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parsed = profileUpdateBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body",
      });
      return;
    }

    const body = parsed.data;
    const sets: string[] = [];
    const params: unknown[] = [];
    let i = 1;

    if (body.bio !== undefined) {
      sets.push(`bio = $${i++}`);
      params.push(body.bio);
    }
    if (body.specializations !== undefined) {
      sets.push(`specializations = $${i++}`);
      params.push(body.specializations);
    }
    if (body.languages !== undefined) {
      sets.push(`languages = $${i++}`);
      params.push(body.languages);
    }
    if (body.price_per_minute !== undefined) {
      sets.push(`price_per_minute = $${i++}`);
      params.push(body.price_per_minute);
    }
    if (body.experience_years !== undefined) {
      sets.push(`experience_years = $${i++}`);
      params.push(body.experience_years);
    }

    if (sets.length === 0) {
      res.status(400).json({ success: false, error: "No fields to update" });
      return;
    }

    params.push(userId);
    const result = await query(
      `UPDATE astrologers SET ${sets.join(", ")} WHERE user_id = $${i}
       RETURNING id, bio, specializations, languages, rating, total_reviews,
         price_per_minute, is_available, is_verified, experience_years`,
      params
    );

    const row = result.rows[0] as {
      id: string;
      bio: string | null;
      specializations: string[];
      languages: string[];
      rating: string | null;
      total_reviews: number;
      price_per_minute: string | null;
      is_available: boolean;
      is_verified: boolean;
      experience_years: number | null;
    };

    if (!row) {
      res.status(404).json({ success: false, error: "Astrologer not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        astrologer: {
          ...row,
          rating: row.rating != null ? Number(row.rating) : null,
          price_per_minute:
            row.price_per_minute != null
              ? Number(row.price_per_minute)
              : null,
        },
      },
    });
  }
);

const availabilityBody = z.object({
  is_available: z.boolean(),
});

router.put(
  "/availability",
  authMiddleware,
  requireAstrologer,
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    const parsed = availabilityBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid body",
      });
      return;
    }

    const result = await query<{ is_available: boolean }>(
      `UPDATE astrologers SET is_available = $1 WHERE user_id = $2
       RETURNING is_available`,
      [parsed.data.is_available, userId]
    );

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ success: false, error: "Astrologer not found" });
      return;
    }

    res.json({ success: true, data: { is_available: row.is_available } });
  }
);

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  user_name: string;
};

type DetailRow = {
  id: string;
  bio: string | null;
  specializations: string[];
  languages: string[];
  rating: string | null;
  total_reviews: number;
  price_per_minute: string | null;
  is_available: boolean;
  experience_years: number | null;
  name: string;
  email: string;
  phone: string;
  avatar_url: string | null;
};

router.get("/:id", optionalAuthMiddleware, async (req: Request, res: Response) => {
  const idParse = z.string().uuid().safeParse(req.params.id);
  if (!idParse.success) {
    res.status(400).json({ success: false, error: "Invalid astrologer id" });
    return;
  }
  const id = idParse.data;
  const viewerId = req.user?.userId ?? null;

  const result = await query<DetailRow>(
    `SELECT
          a.id,
          a.bio,
          a.specializations,
          a.languages,
          a.rating,
          a.total_reviews,
          a.price_per_minute,
          a.is_available,
          a.experience_years,
          u.name,
          u.email,
          u.phone,
          u.avatar_url
        FROM astrologers a
        INNER JOIN users u ON u.id = a.user_id
       WHERE a.id = $1
         AND (
           a.is_verified = true
           OR ($2::uuid IS NOT NULL AND a.user_id = $2)
         )`,
    [id, viewerId]
  );

  const row = result.rows[0];
  if (!row) {
    res.status(404).json({ success: false, error: "Astrologer not found" });
    return;
  }

  const reviewsResult = await query<ReviewRow>(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     WHERE r.astrologer_id = $1
     ORDER BY r.created_at DESC`,
    [id]
  );

  res.json({
    success: true,
    data: {
      astrologer: {
        id: row.id,
        bio: row.bio,
        specializations: row.specializations,
        languages: row.languages,
        rating: row.rating != null ? Number(row.rating) : null,
        total_reviews: row.total_reviews,
        price_per_minute:
          row.price_per_minute != null ? Number(row.price_per_minute) : null,
        is_available: row.is_available,
        experience_years: row.experience_years,
        user: {
          name: row.name,
          email: row.email,
          phone: row.phone,
          avatar_url: row.avatar_url,
        },
      },
      reviews: reviewsResult.rows,
    },
  });
});

export { router as astrologersRouter };
