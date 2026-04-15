import { randomInt } from "node:crypto";

import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { query } from "../db/index.js";
import { redis } from "../lib/redis.js";
import { authMiddleware } from "../middleware/auth.js";

const router = Router();

const jwtSecret = (): string => {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error("JWT_SECRET is not set");
  }
  return s;
};

const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Must be a valid 10-digit Indian mobile number");

const sendOtpBody = z.object({
  phone: phoneSchema,
});

const verifyOtpBody = z.object({
  phone: phoneSchema,
  otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

const astrologerLoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

type UserPublic = {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  wallet_balance: number;
};

function toPublicUser(row: {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  wallet_balance: string;
}): UserPublic {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    avatar_url: row.avatar_url,
    wallet_balance: Number(row.wallet_balance),
  };
}

router.post("/send-otp", async (req: Request, res: Response) => {
  const parsed = sendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.flatten().fieldErrors.phone?.[0] ?? "Invalid body",
    });
    return;
  }

  const { phone } = parsed.data;
  const otp = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const key = `otp:${phone}`;

  try {
    await redis.set(key, otp, { EX: 300 });
  } catch (e) {
    console.error("Redis set OTP failed:", e);
    res.status(500).json({ success: false, error: "Failed to send OTP" });
    return;
  }

  const fast2smsKey = process.env.FAST2SMS_API_KEY;
  if (fast2smsKey) {
    try {
      const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: phone,
          flash: 0
        })
      });
      const smsData = await smsRes.json() as { return: boolean; message?: string };
      if (!smsData.return) {
        console.error('Fast2SMS failed:', smsData);
      } else {
        console.log(`OTP sent to ${phone} via Fast2SMS`);
      }
    } catch (e) {
      console.error('Fast2SMS error:', e);
    }
  } else {
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
  }

  res.json({ success: true, message: "OTP sent" });
});

router.post("/verify-otp", async (req: Request, res: Response) => {
  const parsed = verifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error:
        parsed.error.issues[0]?.message ??
        parsed.error.flatten().fieldErrors.phone?.[0] ??
        "Invalid body",
    });
    return;
  }

  const { phone, otp } = parsed.data;
  const key = `otp:${phone}`;

  let stored: string | null;
  try {
    stored = await redis.get(key);
  } catch (e) {
    console.error("Redis get OTP failed:", e);
    res.status(500).json({ success: false, error: "Verification failed" });
    return;
  }

  if (!stored || stored !== otp) {
    res.status(400).json({ success: false, error: "Invalid or expired OTP" });
    return;
  }

  try {
    await redis.del(key);
  } catch (e) {
    console.error("Redis del OTP failed:", e);
  }

  type UserRow = {
    id: string;
    name: string;
    phone: string;
    avatar_url: string | null;
    wallet_balance: string;
  };

  let user: UserRow | undefined;
  const existing = await query<UserRow>(
    `SELECT id, name, phone, avatar_url, wallet_balance FROM users WHERE phone = $1`,
    [phone]
  );

  if (existing.rows[0]) {
    user = existing.rows[0];
  } else {
    const created = await query<UserRow>(
      `INSERT INTO users (phone, name, email)
       VALUES ($1, $2, $3)
       RETURNING id, name, phone, avatar_url, wallet_balance`,
      [phone, "User", `${phone}@otp.local`]
    );
    user = created.rows[0];
  }

  if (!user) {
    res.status(500).json({ success: false, error: "Could not load user" });
    return;
  }

  const token = jwt.sign({ userId: user.id, phone: user.phone }, jwtSecret(), {
    expiresIn: "30d",
  });

  res.json({
    success: true,
    data: {
      token,
      user: toPublicUser(user),
    },
  });
});

router.post("/astrologer/login", async (req: Request, res: Response) => {
  const parsed = astrologerLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid body",
    });
    return;
  }

  const { email, password } = parsed.data;

  type LoginRow = {
    user_id: string;
    password_hash: string | null;
    astrologer_id: string;
    bio: string | null;
    specializations: string[];
    languages: string[];
    rating: string | null;
    total_reviews: number;
    price_per_minute: string | null;
    is_available: boolean;
    is_verified: boolean;
    experience_years: number | null;
    u_email: string;
    u_name: string;
    u_phone: string;
    u_avatar_url: string | null;
  };

  const result = await query<LoginRow>(
    `SELECT
       a.id AS astrologer_id,
       a.user_id,
       a.bio,
       a.specializations,
       a.languages,
       a.rating,
       a.total_reviews,
       a.price_per_minute,
       a.is_available,
       a.is_verified,
       a.experience_years,
       u.password_hash,
       u.email AS u_email,
       u.name AS u_name,
       u.phone AS u_phone,
       u.avatar_url AS u_avatar_url
     FROM users u
     INNER JOIN astrologers a ON a.user_id = u.id
     WHERE u.email = $1`,
    [email]
  );

  const row = result.rows[0];
  if (!row?.password_hash) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) {
    res.status(401).json({ success: false, error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign(
    { userId: row.user_id, role: "astrologer" },
    jwtSecret(),
    { expiresIn: "30d", }
  );

  const astrologer = {
    id: row.astrologer_id,
    user_id: row.user_id,
    bio: row.bio,
    specializations: row.specializations,
    languages: row.languages,
    rating: row.rating != null ? Number(row.rating) : null,
    total_reviews: row.total_reviews,
    price_per_minute:
      row.price_per_minute != null ? Number(row.price_per_minute) : null,
    is_available: row.is_available,
    is_verified: row.is_verified,
    experience_years: row.experience_years,
    user: {
      email: row.u_email,
      name: row.u_name,
      phone: row.u_phone,
      avatar_url: row.u_avatar_url,
    },
  };

  res.json({
    success: true,
    data: { token, astrologer },
  });
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  type FullUser = {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
    wallet_balance: string;
    created_at: Date;
  };

  const result = await query<FullUser>(
    `SELECT id, name, email, phone, avatar_url, wallet_balance, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  const row = result.rows[0];
  if (!row) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }

  res.json({
    success: true,
    data: {
      user: {
        ...row,
        wallet_balance: Number(row.wallet_balance),
      },
    },
  });
});

export { router as authRouter };
