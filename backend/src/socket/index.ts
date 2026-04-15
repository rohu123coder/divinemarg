import jwt from "jsonwebtoken";
import type { Server } from "socket.io";
import { z } from "zod";

import { pool } from "../db/index.js";

declare module "socket.io" {
  interface SocketData {
    user: {
      userId: string;
      role?: string;
    };
  }
}

type SessionRow = {
  id: string;
  user_id: string;
  astrologer_id: string;
  astrologer_user_id: string;
  status: string;
  started_at: Date | null;
  price_per_minute: string | null;
};

const sessionIdPayload = z.object({
  sessionId: z.string().uuid(),
});

const sendMessagePayload = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(10_000),
});

function getSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) {
    throw new Error("JWT_SECRET is required");
  }
  return s;
}

async function loadSessionRow(sessionId: string): Promise<SessionRow | null> {
  const r = await pool.query<SessionRow>(
    `SELECT cs.id,
            cs.user_id,
            cs.astrologer_id,
            a.user_id AS astrologer_user_id,
            cs.status,
            cs.started_at,
            a.price_per_minute
     FROM chat_sessions cs
     INNER JOIN astrologers a ON a.id = cs.astrologer_id
     WHERE cs.id = $1`,
    [sessionId]
  );
  return r.rows[0] ?? null;
}

async function finalizeChatSession(
  io: Server,
  sessionId: string
): Promise<
  | { ended: true; totalMinutes: number; totalCharged: number }
  | { ended: false; reason: "deduction_failed" }
  | null
> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const lockResult = await client.query<{
      id: string;
      user_id: string;
      astrologer_id: string;
      status: string;
      started_at: Date | null;
      price_per_minute: string | null;
    }>(
      `SELECT cs.id, cs.user_id, cs.astrologer_id, cs.status, cs.started_at,
              a.price_per_minute
       FROM chat_sessions cs
       INNER JOIN astrologers a ON a.id = cs.astrologer_id
       WHERE cs.id = $1
       FOR UPDATE`,
      [sessionId]
    );

    const row = lockResult.rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return null;
    }

    if (row.status === "ended") {
      await client.query("ROLLBACK");
      return null;
    }

    const price = Number(row.price_per_minute ?? 0);
    let totalMinutes = 0;
    if (row.started_at) {
      const ms = Date.now() - new Date(row.started_at).getTime();
      totalMinutes = Math.max(0, Math.ceil(ms / 60_000));
    }

    const rawCharge = totalMinutes * price;
    const totalCharged = Math.round(rawCharge * 100) / 100;
    const userId = row.user_id;

    if (totalCharged > 0) {
      const deduct = await client.query<{ wallet_balance: string }>(
        `UPDATE users
         SET wallet_balance = wallet_balance - $1::numeric
         WHERE id = $2 AND wallet_balance >= $1::numeric
         RETURNING wallet_balance`,
        [totalCharged, userId]
      );
      if (deduct.rows.length === 0) {
        await client.query("ROLLBACK");
        return { ended: false, reason: "deduction_failed" };
      }

      await client.query(
        `INSERT INTO transactions (user_id, type, amount, status)
         VALUES ($1, 'deduction', $2, 'success')`,
        [userId, totalCharged]
      );

      await client.query(
        `INSERT INTO astrologer_earnings_log (astrologer_id, session_id, amount)
         VALUES ($1, $2, $3)`,
        [row.astrologer_id, sessionId, totalCharged]
      );
    }

    await client.query(
      `UPDATE chat_sessions
       SET status = 'ended',
           ended_at = now(),
           total_minutes = $1,
           total_charged = $2::numeric
       WHERE id = $3`,
      [totalMinutes, totalCharged, sessionId]
    );

    await client.query("COMMIT");

    io.to(sessionId).emit("session_ended", {
      sessionId,
      totalMinutes,
      totalCharged,
    });

    return { ended: true, totalMinutes, totalCharged };
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("finalizeChatSession failed:", e);
    return null;
  } finally {
    client.release();
  }
}

async function billingTick(io: Server): Promise<void> {
  const result = await pool.query<{
    id: string;
    wallet_balance: string;
    price_per_minute: string | null;
  }>(
    `SELECT cs.id, u.wallet_balance, a.price_per_minute
     FROM chat_sessions cs
     INNER JOIN users u ON u.id = cs.user_id
     INNER JOIN astrologers a ON a.id = cs.astrologer_id
     WHERE cs.status = 'active'`
  );

  for (const row of result.rows) {
    const balance = Number(row.wallet_balance ?? 0);
    const ppm = Number(row.price_per_minute ?? 0);
    if (ppm <= 0) {
      continue;
    }
    if (balance < ppm) {
      io.to(row.id).emit("insufficient_balance", { sessionId: row.id });
      await finalizeChatSession(io, row.id);
    }
  }
}

export function registerSocketHandlers(io: Server): void {
  const secret = getSecret();

  io.use((socket, next) => {
    const raw = socket.handshake.auth;
    const token =
      raw && typeof raw === "object" && "token" in raw ? raw.token : undefined;
    if (typeof token !== "string" || !token.trim()) {
      next(new Error("Unauthorized"));
      return;
    }
    try {
      const decoded = jwt.verify(token, secret) as {
        userId?: string;
        role?: string;
      };
      if (!decoded?.userId) {
        next(new Error("Unauthorized"));
        return;
      }
      socket.data.user = {
        userId: decoded.userId,
        role: decoded.role,
      };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  setInterval(() => {
    void billingTick(io).catch((err) =>
      console.error("billingTick failed:", err)
    );
  }, 60_000);

  io.on("connection", (socket) => {
    const user = socket.data.user;
    socket.join(`user:${user.userId}`);

    socket.on("join_user_room", () => {
      socket.join(`user:${user.userId}`);
    });

    socket.on("join_session", async (payload: unknown) => {
      const parsed = sessionIdPayload.safeParse(payload);
      if (!parsed.success) {
        return;
      }
      const { sessionId } = parsed.data;

      const session = await loadSessionRow(sessionId);
      if (!session) {
        return;
      }

      const uid = user.userId;
      const isParticipant =
        uid === session.user_id || uid === session.astrologer_user_id;
      if (!isParticipant) {
        return;
      }

      await socket.join(sessionId);

      if (user.role === "astrologer" && session.status === "waiting") {
        const upd = await pool.query<{ started_at: Date }>(
          `UPDATE chat_sessions
           SET status = 'active', started_at = now()
           WHERE id = $1 AND status = 'waiting'
           RETURNING started_at`,
          [sessionId]
        );
        const started = upd.rows[0];
        if (started) {
          io.to(sessionId).emit("session_started", {
            sessionId,
            startedAt: started.started_at.toISOString(),
          });
          return;
        }
      }

      const latest = await loadSessionRow(sessionId);
      socket.emit("joined_session", {
        sessionId,
        status: latest?.status ?? session.status,
      });
    });

    socket.on("send_message", async (payload: unknown) => {
      const parsed = sendMessagePayload.safeParse(payload);
      if (!parsed.success) {
        return;
      }
      const { sessionId, content } = parsed.data;

      const session = await loadSessionRow(sessionId);
      if (!session || session.status !== "active") {
        return;
      }

      const uid = user.userId;
      const isParticipant =
        uid === session.user_id || uid === session.astrologer_user_id;
      if (!isParticipant) {
        return;
      }

      const senderType =
        user.role === "astrologer" ? "astrologer" : "user";

      const ins = await pool.query<{
        id: string;
        created_at: Date;
      }>(
        `INSERT INTO messages (session_id, sender_id, sender_type, content)
         VALUES ($1, $2, $3::message_sender_type, $4)
         RETURNING id, created_at`,
        [sessionId, uid, senderType, content]
      );
      const row = ins.rows[0];
      if (!row) {
        return;
      }

      io.to(sessionId).emit("new_message", {
        id: row.id,
        sessionId,
        senderId: uid,
        senderType,
        content,
        createdAt: row.created_at.toISOString(),
      });
    });

    socket.on("typing", async (payload: unknown) => {
      const parsed = sessionIdPayload.safeParse(payload);
      if (!parsed.success) {
        return;
      }
      const { sessionId } = parsed.data;

      const session = await loadSessionRow(sessionId);
      if (!session) {
        return;
      }
      const uid = user.userId;
      const isParticipant =
        uid === session.user_id || uid === session.astrologer_user_id;
      if (!isParticipant) {
        return;
      }

      socket.to(sessionId).emit("user_typing", {
        userId: uid,
        sessionId,
      });
    });

    socket.on("end_session", async (payload: unknown) => {
      const parsed = sessionIdPayload.safeParse(payload);
      if (!parsed.success) {
        return;
      }
      const { sessionId } = parsed.data;

      const session = await loadSessionRow(sessionId);
      if (!session) {
        return;
      }
      const uid = user.userId;
      const isParticipant =
        uid === session.user_id || uid === session.astrologer_user_id;
      if (!isParticipant) {
        return;
      }

      await finalizeChatSession(io, sessionId);
    });

    socket.on("decline_request", async (payload: unknown) => {
      const parsed = sessionIdPayload.safeParse(payload);
      if (!parsed.success) {
        return;
      }
      const { sessionId } = parsed.data;
      if (user.role !== "astrologer") {
        return;
      }

      const session = await loadSessionRow(sessionId);
      if (!session || session.astrologer_user_id !== user.userId) {
        return;
      }
      if (session.status !== "waiting") {
        return;
      }

      await pool.query(
        `UPDATE chat_sessions
         SET status = 'ended',
             ended_at = now(),
             total_minutes = 0,
             total_charged = 0
         WHERE id = $1 AND status = 'waiting'`,
        [sessionId]
      );

      io.to(sessionId).emit("session_ended", {
        sessionId,
        totalMinutes: 0,
        totalCharged: 0,
      });
    });

    socket.on("disconnect", () => {
      const uid = user.userId;
      setTimeout(async () => {
        try {
          // If the user reconnected in the grace window, do not end sessions.
          const userRoomSockets = await io.in(`user:${uid}`).fetchSockets();
          const stillDisconnected = userRoomSockets.length === 0;
          if (!stillDisconnected) {
            return;
          }

          const open = await pool.query<{ id: string }>(
            `SELECT cs.id
             FROM chat_sessions cs
             INNER JOIN astrologers a ON a.id = cs.astrologer_id
             WHERE cs.status IN ('waiting', 'active')
               AND (cs.user_id = $1 OR a.user_id = $1)`,
            [uid]
          );
          for (const row of open.rows) {
            await finalizeChatSession(io, row.id);
          }
        } catch (err) {
          console.error("disconnect grace-period handling failed:", err);
        }
      }, 10_000);
    });
  });
}
