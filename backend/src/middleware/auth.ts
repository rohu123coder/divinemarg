import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!secret) {
    console.error("JWT_SECRET is not set");
    res.status(500).json({ success: false, error: "Server misconfiguration" });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as Express.Request["user"] & {
      userId?: string;
    };
    if (!decoded?.userId) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }
    req.user = {
      userId: decoded.userId,
      phone: decoded.phone,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized" });
  }
}

export function requireAstrologer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== "astrologer") {
    res.status(403).json({ success: false, error: "Astrologer access only" });
    return;
  }
  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const role = req.user?.role;
  if (role !== "admin" && role !== "superadmin") {
    res.status(403).json({ success: false, error: "Admin access only" });
    return;
  }
  next();
}

/** Attaches `req.user` when a valid Bearer token is present; no-op otherwise. */
export function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!secret) {
    next();
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as {
      userId?: string;
      phone?: string;
      role?: string;
      iat?: number;
      exp?: number;
    };
    if (decoded?.userId) {
      req.user = {
        userId: decoded.userId,
        phone: decoded.phone,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp,
      };
    }
  } catch {
    // public response when token invalid
  }
  next();
}
