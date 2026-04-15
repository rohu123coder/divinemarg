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
  astrologer_name: string;
  status: string;
  started_at: Date | null;
  price_per_minute: string | null;
};

type LiveSessionState = {
  startTime: number;
  timerInterval: ReturnType<typeof setInterval> | null;
  billed: boolean;
  messageCount: number;
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
            au.name AS astrologer_name,
            cs.status,
            cs.started_at,
            a.price_per_minute
     FROM chat_sessions cs
     INNER JOIN astrologers a ON a.id = cs.astrologer_id
     INNER JOIN users au ON au.id = a.user_id
     WHERE cs.id = $1`,
    [sessionId]
  );
  return r.rows[0] ?? null;
}

const liveSessions = new Map<string, LiveSessionState>();

// BILLING TEST CHECKLIST:
// 1. Normal session: chat 2 min → End Session → wallet -₹30, astrologer +₹30, dashboard shows "2 min / ₹30"
// 2. Sub-minute session with messages: chat 30s, send 1 msg → End → charge ₹15 (min 1 min rule)
// 3. Sub-minute session NO messages: join → End immediately → charge ₹0
// 4. Double end: user clicks End Chat, astrologer also clicks End Session simultaneously → billing fires once only
// 5. Server restart mid-session: restart backend → rejoin → timer resumes from DB started_at → End → correct duration billed
// 6. Wallet display: after session ends, navbar + dashboard wallet shows updated balance (not stale ₹500)

function ensureLiveSession(
  sessionId: string,
  startTime?: number
): LiveSessionState {
  const existing = liveSessions.get(sessionId);
  if (existing) {
    if (typeof startTime === "number" && Number.isFinite(startTime)) {
      existing.startTime = Math.min(existing.startTime, startTime);
    }
    return existing;
  }
  const next: LiveSessionState = {
    startTime:
      typeof startTime === "number" && Number.isFinite(startTime)
        ? startTime
        : Date.now(),
    timerInterval: null,
    billed: false,
    messageCount: 0,
  };
  liveSessions.set(sessionId, next);
  return next;
}

function emitSessionTick(io: Server, sessionId: string): void {
  const state = liveSessions.get(sessionId);
  if (!state) {
    return;
  }
  const elapsedMs = Date.now() - state.startTime;
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMs / 60_000));
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  io.to(sessionId).emit("session_tick", { elapsedMinutes, elapsedSeconds });
}

function startSessionTimer(
  io: Server,
  sessionId: string,
  startTime?: number
): void {
  const state = ensureLiveSession(sessionId, startTime);
  if (state.timerInterval) {
    return;
  }
  state.timerInterval = setInterval(() => {
    if (!liveSessions.has(sessionId)) {
      return;
    }
    emitSessionTick(io, sessionId);
  }, 1000);
  emitSessionTick(io, sessionId);
  console.log("[TIMER] session started", sessionId, new Date().toISOString());
}

function stopSessionTimer(sessionId: string): LiveSessionState | null {
  const state = liveSessions.get(sessionId);
  if (!state) {
    return null;
  }
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
  }
  state.timerInterval = null;
  return state;
}

async function finalizeChatSession(
  io: Server,
  sessionId: string
): Promise<
  | { ended: true; totalMinutes: number; totalCharged: number }
  | { ended: false; reason: "deduction_failed" }
  | null
> {
  const liveState = liveSessions.get(sessionId);
  if (liveState?.billed) {
    return null;
  }
  if (liveState) {
    liveState.billed = true;
  }

  let live: LiveSessionState | null = null;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const lockResult = await client.query<{
      id: string;
      user_id: string;
      astrologer_id: string;
      astrologer_name: string;
      status: string;
      started_at: Date | null;
      price_per_minute: string | null;
    }>(
      `SELECT cs.id, cs.user_id, cs.astrologer_id, au.name AS astrologer_name,
              cs.status, cs.started_at, a.price_per_minute
       FROM chat_sessions cs
       INNER JOIN astrologers a ON a.id = cs.astrologer_id
       INNER JOIN users au ON au.id = a.user_id
       WHERE cs.id = $1
       FOR UPDATE`,
      [sessionId]
    );

    const row = lockResult.rows[0];
    if (!row) {
      if (liveState) {
        liveState.billed = false;
      }
      await client.query("ROLLBACK");
      return null;
    }

    if (row.status === "ended") {
      liveSessions.delete(sessionId);
      await client.query("ROLLBACK");
      return null;
    }

    live = stopSessionTimer(sessionId);
    const price = Number(row.price_per_minute ?? 0);
    if (!live) {
      console.log("[TIMER] using DB fallback for duration calc", sessionId);
    }
    const authoritativeStart =
      live?.startTime ??
      (row.started_at ? new Date(row.started_at).getTime() : Date.now());
    const rawDuration = Math.max(
      0,
      Math.ceil((Date.now() - authoritativeStart) / 60_000)
    );
    const finalDuration =
      rawDuration === 0 && (live?.messageCount ?? 0) > 0 ? 1 : rawDuration;

    const rawCharge = finalDuration * price;
    const totalCharged = Math.round(rawCharge * 100) / 100;
    const userId = row.user_id;
    const astrologerName = row.astrologer_name;

    if (totalCharged > 0) {
      const deduct = await client.query<{ wallet_balance: string }>(
        `UPDATE users
         SET wallet_balance = wallet_balance - $1::numeric
         WHERE id = $2 AND wallet_balance >= $1::numeric
         RETURNING wallet_balance`,
        [totalCharged, userId]
      );
      if (deduct.rows.length === 0) {
        if (live) {
          startSessionTimer(io, sessionId, live.startTime);
          live.billed = false;
        }
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
      [finalDuration, totalCharged, sessionId]
    );

    await client.query("COMMIT");
    liveSessions.delete(sessionId);

    console.log("[TIMER] session ended", sessionId, "duration:", finalDuration, "mins");
    console.log("[BILLING] charged:", finalDuration * price);
    console.log(
      "[BILLING AUDIT]",
      JSON.stringify({
        sessionId,
        userId,
        astrologerName,
        durationMinutes: finalDuration,
        ratePerMinute: price,
        totalCharged,
        timestamp: new Date().toISOString(),
        timerSource: live ? "live_memory" : "db_fallback",
      })
    );

    io.to(sessionId).emit("session_ended", {
      sessionId,
      duration: finalDuration,
      charge: totalCharged,
      astrologerName,
      totalMinutes: finalDuration,
      totalCharged,
    });

    return { ended: true, totalMinutes: finalDuration, totalCharged };
  } catch (e) {
    if (live) {
      startSessionTimer(io, sessionId, live.startTime);
      live.billed = false;
    } else if (liveState) {
      liveState.billed = false;
    }
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
          startSessionTimer(io, sessionId, started.started_at.getTime());
          io.to(sessionId).emit("session_started", {
            sessionId,
            startedAt: started.started_at.toISOString(),
          });
          return;
        }
      }

      const latest = await loadSessionRow(sessionId);
      if (latest?.status === "active") {
        const startedAtMs = latest.started_at
          ? new Date(latest.started_at).getTime()
          : Date.now();
        if (!liveSessions.has(sessionId)) {
          console.log("[TIMER] recovered session from DB", sessionId);
        }
        startSessionTimer(io, sessionId, startedAtMs);
        socket.emit("session_tick", {
          elapsedMinutes: Math.max(
            0,
            Math.floor((Date.now() - startedAtMs) / 60_000)
          ),
          elapsedSeconds: Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)),
        });
      }
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
      const state = ensureLiveSession(
        sessionId,
        session.started_at ? new Date(session.started_at).getTime() : Date.now()
      );
      state.messageCount = (state.messageCount ?? 0) + 1;

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
      stopSessionTimer(sessionId);
      liveSessions.delete(sessionId);

      io.to(sessionId).emit("session_ended", {
        sessionId,
        duration: 0,
        charge: 0,
        astrologerName: session.astrologer_name,
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
