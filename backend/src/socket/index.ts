import jwt from "jsonwebtoken";
import type { PoolClient } from "pg";
import type { Server } from "socket.io";
import { z } from "zod";

import { pool } from "../db/index.js";
import { generateAgoraToken, generateChannelName } from "../services/agoraService.js";

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
  userMessageCount: number;
  astrologerMessageCount: number;
};

const sessionIdPayload = z.object({
  sessionId: z.string().uuid(),
});

const sendMessagePayload = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(10_000),
});

const callTypePayload = z.enum(["voice", "video"]);
const initiateCallPayload = z.object({
  sessionId: z.string().uuid(),
  callType: callTypePayload,
});

const joinWaitlistPayload = z.object({
  astrologerId: z.string().uuid(),
});

const waitlistActionPayload = z.object({
  waitlistId: z.string().uuid(),
  action: z.enum(["accept", "decline", "already_added"]),
});

const cancelWaitlistPayload = z.object({
  waitlistId: z.string().uuid(),
  astrologerId: z.string().uuid().optional(),
});

const acceptFromWaitlistPayload = z.object({
  waitlistId: z.string().uuid(),
  userId: z.string().uuid().optional(),
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
const waitingSessionTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
type PendingCall = {
  timeout: ReturnType<typeof setTimeout>;
  callerUserId: string;
  otherUserId: string;
  callType: "voice" | "video";
  channelName: string;
};
const pendingCalls = new Map<string, PendingCall>();

type CallSessionRow = {
  id: string;
  status: string;
  user_id: string;
  astrologer_user_id: string;
  user_name: string;
  astrologer_name: string;
  price_per_minute: string | null;
  session_type: string | null;
  call_channel_name: string | null;
};

async function loadCallSessionRow(sessionId: string): Promise<CallSessionRow | null> {
  const r = await pool.query<CallSessionRow>(
    `SELECT cs.id,
            cs.status,
            cs.user_id,
            a.user_id AS astrologer_user_id,
            u.name AS user_name,
            au.name AS astrologer_name,
            a.price_per_minute AS price_per_minute,
            cs.session_type,
            cs.call_channel_name AS call_channel_name
     FROM chat_sessions cs
     INNER JOIN astrologers a ON a.id = cs.astrologer_id
     INNER JOIN users u ON u.id = cs.user_id
     INNER JOIN users au ON au.id = a.user_id
     WHERE cs.id = $1`,
    [sessionId]
  );
  return r.rows[0] ?? null;
}

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
    userMessageCount: 0,
    astrologerMessageCount: 0,
  };
  liveSessions.set(sessionId, next);
  return next;
}

function clearWaitingSessionTimeout(sessionId: string): void {
  const t = waitingSessionTimeouts.get(sessionId);
  if (!t) {
    return;
  }
  clearTimeout(t);
  waitingSessionTimeouts.delete(sessionId);
}

type WaitlistQueueRow = {
  id: string;
  astrologer_id: string;
  user_id: string;
  user_name: string;
  position: number;
};

type WaitlistPositionRow = {
  id: string;
  user_id: string;
  position: number;
};

async function loadAstrologerQueue(
  astrologerId: string
): Promise<WaitlistQueueRow[]> {
  const queueResult = await pool.query<WaitlistQueueRow>(
    `SELECT w.id,
            w.astrologer_id,
            w.user_id,
            w.position,
            u.name AS user_name
     FROM astrologer_waitlist w
     INNER JOIN users u ON u.id = w.user_id
     WHERE w.astrologer_id = $1
       AND w.status = 'waiting'
     ORDER BY w.position`,
    [astrologerId]
  );
  return queueResult.rows;
}

async function emitQueuePositionUpdates(
  io: Server,
  astrologerId: string
): Promise<void> {
  const result = await pool.query<WaitlistPositionRow>(
    `SELECT id, user_id, position
     FROM astrologer_waitlist
     WHERE astrologer_id = $1
       AND status = 'waiting'
     ORDER BY position`,
    [astrologerId]
  );
  const queueLength = result.rows.length;
  for (const row of result.rows) {
    io.to(`user:${row.user_id}`).emit("queue_position_update", {
      waitlistId: row.id,
      astrologerId,
      newPosition: row.position,
      queueLength,
    });
  }
}

async function emitWaitlistUpdated(
  io: Server,
  astrologerUserId: string,
  astrologerId: string
): Promise<WaitlistQueueRow[]> {
  const queue = await loadAstrologerQueue(astrologerId);
  io.to(`user:${astrologerUserId}`).emit("waitlist_updated", {
    queue: queue.map((row) => ({
      waitlistId: row.id,
      userId: row.user_id,
      userName: row.user_name,
      position: row.position,
    })),
    total: queue.length,
  });
  return queue;
}

async function reorderWaitlistAfterRemoval(
  client: PoolClient,
  astrologerId: string,
  removedPosition: number
): Promise<void> {
  await client.query(
    `UPDATE astrologer_waitlist
     SET position = position - 1,
         updated_at = now()
     WHERE astrologer_id = $1
       AND status = 'waiting'
       AND position > $2`,
    [astrologerId, removedPosition]
  );
}

async function acceptWaitlistEntry(
  io: Server,
  astrologerUserId: string,
  waitlistId: string
): Promise<{ ok: true; sessionId: string } | { ok: false; reason: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const waitlistResult = await client.query<{
      id: string;
      astrologer_id: string;
      user_id: string;
      position: number;
      status: string;
      user_name: string;
      astrologer_name: string;
    }>(
      `SELECT w.id,
              w.astrologer_id,
              w.user_id,
              w.position,
              w.status,
              u.name AS user_name,
              au.name AS astrologer_name
       FROM astrologer_waitlist w
       INNER JOIN users u ON u.id = w.user_id
       INNER JOIN astrologers a ON a.id = w.astrologer_id
       INNER JOIN users au ON au.id = a.user_id
       WHERE w.id = $1
         AND a.user_id = $2
       FOR UPDATE`,
      [waitlistId, astrologerUserId]
    );
    const wait = waitlistResult.rows[0];
    if (!wait || wait.status !== "waiting") {
      await client.query("ROLLBACK");
      return { ok: false, reason: "waitlist_not_available" };
    }

    const activeSession = await client.query<{ id: string }>(
      `SELECT id
       FROM chat_sessions
       WHERE astrologer_id = $1
         AND status = 'active'
       LIMIT 1`,
      [wait.astrologer_id]
    );
    if (activeSession.rows[0]) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "astrologer_busy" };
    }

    const sessionInsert = await client.query<{ id: string }>(
      `INSERT INTO chat_sessions (user_id, astrologer_id, status, started_at)
       VALUES ($1, $2, 'active', now())
       RETURNING id`,
      [wait.user_id, wait.astrologer_id]
    );
    const session = sessionInsert.rows[0];
    if (!session) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "session_create_failed" };
    }

    await client.query(
      `UPDATE astrologer_waitlist
       SET status = 'accepted',
           session_id = $2,
           updated_at = now()
       WHERE id = $1`,
      [wait.id, session.id]
    );
    await reorderWaitlistAfterRemoval(client, wait.astrologer_id, wait.position);
    await client.query("COMMIT");

    io.to(`user:${wait.user_id}`).emit("session_starting", {
      sessionId: session.id,
      astrologerId: wait.astrologer_id,
      astrologerName: wait.astrologer_name,
    });
    io.to(`user:${astrologerUserId}`).emit("waitlist_session_started", {
      waitlistId: wait.id,
      sessionId: session.id,
      userId: wait.user_id,
      userName: wait.user_name,
    });
    await emitWaitlistUpdated(io, astrologerUserId, wait.astrologer_id);
    await emitQueuePositionUpdates(io, wait.astrologer_id);
    return { ok: true, sessionId: session.id };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("acceptWaitlistEntry failed:", err);
    return { ok: false, reason: "internal_error" };
  } finally {
    client.release();
  }
}

async function autoCancelWaitingSession(
  io: Server,
  sessionId: string
): Promise<void> {
  clearWaitingSessionTimeout(sessionId);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const lockResult = await client.query<{
      id: string;
      user_id: string;
      astrologer_user_id: string;
      astrologer_name: string;
      status: string;
    }>(
      `SELECT cs.id,
              cs.user_id,
              a.user_id AS astrologer_user_id,
              au.name AS astrologer_name,
              cs.status
       FROM chat_sessions cs
       INNER JOIN astrologers a ON a.id = cs.astrologer_id
       INNER JOIN users au ON au.id = a.user_id
       WHERE cs.id = $1
       FOR UPDATE`,
      [sessionId]
    );
    const row = lockResult.rows[0];
    if (!row || row.status !== "waiting") {
      await client.query("ROLLBACK");
      return;
    }

    await client.query(
      `UPDATE chat_sessions
       SET status = 'cancelled',
           ended_at = now(),
           total_minutes = 0,
           total_charged = 0
       WHERE id = $1 AND status = 'waiting'`,
      [sessionId]
    );
    await client.query("COMMIT");

    stopSessionTimer(sessionId);
    liveSessions.delete(sessionId);

    const payload = {
      sessionId,
      reason: "astrologer_unavailable" as const,
    };
    io.to(sessionId).emit("session_cancelled", payload);
    io.to(`user:${row.user_id}`).emit("session_cancelled", payload);
    io.to(`user:${row.astrologer_user_id}`).emit("session_cancelled", payload);

    io.to(sessionId).emit("session_ended", {
      sessionId,
      duration: 0,
      charge: 0,
      astrologerName: row.astrologer_name,
      totalMinutes: 0,
      totalCharged: 0,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("autoCancelWaitingSession failed:", err);
  } finally {
    client.release();
  }
}

function ensureWaitingSessionTimeout(io: Server, sessionId: string): void {
  if (waitingSessionTimeouts.has(sessionId)) {
    return;
  }
  const timeout = setTimeout(() => {
    void autoCancelWaitingSession(io, sessionId);
  }, 60_000);
  waitingSessionTimeouts.set(sessionId, timeout);
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
      astrologer_user_id: string;
      astrologer_name: string;
      status: string;
      started_at: Date | null;
      price_per_minute: string | null;
    }>(
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

    if (row.status === "ended" || row.status === "cancelled") {
      clearWaitingSessionTimeout(sessionId);
      liveSessions.delete(sessionId);
      await client.query("ROLLBACK");
      return null;
    }

    clearWaitingSessionTimeout(sessionId);
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
    const bothCommunicated =
      (live?.userMessageCount ?? 0) >= 1 &&
      (live?.astrologerMessageCount ?? 0) >= 1;
    const finalDuration = rawDuration > 0 ? rawDuration : bothCommunicated ? 1 : 0;
    const effectiveDuration = bothCommunicated ? finalDuration : 0;

    const rawCharge = effectiveDuration * price;
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
      [effectiveDuration, totalCharged, sessionId]
    );

    await client.query("COMMIT");
    liveSessions.delete(sessionId);

    console.log("[TIMER] session ended", sessionId, "duration:", effectiveDuration, "mins");
    console.log("[BILLING] charged:", effectiveDuration * price);
    console.log(
      "[BILLING AUDIT]",
      JSON.stringify({
        sessionId,
        userId,
        astrologerName,
        durationMinutes: effectiveDuration,
        ratePerMinute: price,
        totalCharged,
        timestamp: new Date().toISOString(),
        timerSource: live ? "live_memory" : "db_fallback",
        bothCommunicated,
        userMessageCount: live?.userMessageCount ?? 0,
        astrologerMessageCount: live?.astrologerMessageCount ?? 0,
      })
    );

    io.to(sessionId).emit("session_ended", {
      sessionId,
      duration: effectiveDuration,
      charge: totalCharged,
      astrologerName,
      totalMinutes: effectiveDuration,
      totalCharged,
    });

    const waitlistQueue = await emitWaitlistUpdated(
      io,
      row.astrologer_user_id,
      row.astrologer_id
    );
    if (waitlistQueue.length > 0) {
      io.to(`user:${row.astrologer_user_id}`).emit("waitlist_ready", {
        queue: waitlistQueue.slice(0, 5).map((item) => ({
          waitlistId: item.id,
          userId: item.user_id,
          userName: item.user_name,
          position: item.position,
        })),
      });
    }
    await emitQueuePositionUpdates(io, row.astrologer_id);

    return { ended: true, totalMinutes: effectiveDuration, totalCharged };
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

    socket.on("join_waitlist", async (payload: unknown) => {
      const parsed = joinWaitlistPayload.safeParse(payload);
      if (!parsed.success || user.role === "astrologer") {
        return;
      }
      const { astrologerId } = parsed.data;

      const astroResult = await pool.query<{
        astrologer_id: string;
        astrologer_user_id: string;
        astrologer_name: string;
        user_name: string;
      }>(
        `SELECT a.id AS astrologer_id,
                a.user_id AS astrologer_user_id,
                au.name AS astrologer_name,
                u.name AS user_name
         FROM astrologers a
         INNER JOIN users au ON au.id = a.user_id
         INNER JOIN users u ON u.id = $2
         WHERE a.id = $1`,
        [astrologerId, user.userId]
      );
      const astro = astroResult.rows[0];
      if (!astro) {
        socket.emit("waitlist_error", { reason: "astrologer_not_found" });
        return;
      }

      const activeResult = await pool.query<{ id: string }>(
        `SELECT id
         FROM chat_sessions
         WHERE astrologer_id = $1
           AND status = 'active'
         LIMIT 1`,
        [astrologerId]
      );
      if (!activeResult.rows[0]) {
        socket.emit("waitlist_error", {
          reason: "astrologer_available",
          astrologerId,
        });
        return;
      }

      const existingResult = await pool.query<{
        id: string;
        position: number;
      }>(
        `SELECT id, position
         FROM astrologer_waitlist
         WHERE astrologer_id = $1
           AND user_id = $2
           AND status = 'waiting'
         LIMIT 1`,
        [astrologerId, user.userId]
      );
      const existing = existingResult.rows[0];
      if (existing) {
        const queue = await emitWaitlistUpdated(
          io,
          astro.astrologer_user_id,
          astrologerId
        );
        await emitQueuePositionUpdates(io, astrologerId);
        socket.emit("waitlist_joined", {
          waitlistId: existing.id,
          position: existing.position,
          queueLength: queue.length,
          astrologerId,
        });
        io.to(`user:${astro.astrologer_user_id}`).emit("waitlist_request", {
          userId: user.userId,
          userName: astro.user_name,
          waitlistId: existing.id,
          position: existing.position,
          astrologerId,
        });
        return;
      }

      const insertResult = await pool.query<{
        id: string;
        position: number;
      }>(
        `WITH next_pos AS (
           SELECT COALESCE(MAX(position), 0) + 1 AS pos
           FROM astrologer_waitlist
           WHERE astrologer_id = $1
             AND status = 'waiting'
         )
         INSERT INTO astrologer_waitlist (
           astrologer_id,
           user_id,
           position,
           status
         )
         VALUES ($1, $2, (SELECT pos FROM next_pos), 'waiting')
         RETURNING id, position`,
        [astrologerId, user.userId]
      );
      const created = insertResult.rows[0];
      if (!created) {
        socket.emit("waitlist_error", { reason: "waitlist_create_failed" });
        return;
      }

      const queue = await emitWaitlistUpdated(io, astro.astrologer_user_id, astrologerId);
      await emitQueuePositionUpdates(io, astrologerId);

      socket.emit("waitlist_joined", {
        waitlistId: created.id,
        position: created.position,
        queueLength: queue.length,
        astrologerId,
      });
      io.to(`user:${astro.astrologer_user_id}`).emit("waitlist_request", {
        userId: user.userId,
        userName: astro.user_name,
        waitlistId: created.id,
        position: created.position,
        astrologerId,
      });
    });

    socket.on("waitlist_action", async (payload: unknown) => {
      const parsed = waitlistActionPayload.safeParse(payload);
      if (!parsed.success || user.role !== "astrologer") {
        return;
      }
      const { waitlistId, action } = parsed.data;

      if (action === "already_added") {
        socket.emit("waitlist_action_ack", { waitlistId, action });
        return;
      }

      if (action === "accept") {
        const accepted = await acceptWaitlistEntry(io, user.userId, waitlistId);
        const acceptReason = "reason" in accepted ? accepted.reason : undefined;
        const acceptedSessionId = accepted.ok ? accepted.sessionId : undefined;
        socket.emit("waitlist_action_ack", {
          waitlistId,
          action,
          ok: accepted.ok,
          reason: acceptReason,
          sessionId: acceptedSessionId,
        });
        return;
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const rowResult = await client.query<{
          id: string;
          astrologer_id: string;
          user_id: string;
          position: number;
          astrologer_user_id: string;
          status: string;
        }>(
          `SELECT w.id,
                  w.astrologer_id,
                  w.user_id,
                  w.position,
                  a.user_id AS astrologer_user_id,
                  w.status
           FROM astrologer_waitlist w
           INNER JOIN astrologers a ON a.id = w.astrologer_id
           WHERE w.id = $1
             AND a.user_id = $2
           FOR UPDATE`,
          [waitlistId, user.userId]
        );
        const row = rowResult.rows[0];
        if (!row || row.status !== "waiting") {
          await client.query("ROLLBACK");
          socket.emit("waitlist_action_ack", {
            waitlistId,
            action,
            ok: false,
            reason: "waitlist_not_available",
          });
          return;
        }

        await client.query(
          `UPDATE astrologer_waitlist
           SET status = 'cancelled',
               updated_at = now()
           WHERE id = $1`,
          [row.id]
        );
        await reorderWaitlistAfterRemoval(client, row.astrologer_id, row.position);
        await client.query("COMMIT");

        io.to(`user:${row.user_id}`).emit("waitlist_declined", {
          waitlistId: row.id,
          astrologerId: row.astrologer_id,
        });
        await emitWaitlistUpdated(io, row.astrologer_user_id, row.astrologer_id);
        await emitQueuePositionUpdates(io, row.astrologer_id);
        socket.emit("waitlist_action_ack", { waitlistId, action, ok: true });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("waitlist_action decline failed:", err);
      } finally {
        client.release();
      }
    });

    socket.on("accept_from_waitlist", async (payload: unknown) => {
      const parsed = acceptFromWaitlistPayload.safeParse(payload);
      if (!parsed.success || user.role !== "astrologer") {
        return;
      }
      const { waitlistId } = parsed.data;
      const accepted = await acceptWaitlistEntry(io, user.userId, waitlistId);
      const acceptReason = "reason" in accepted ? accepted.reason : undefined;
      const acceptedSessionId = accepted.ok ? accepted.sessionId : undefined;
      socket.emit("waitlist_action_ack", {
        waitlistId,
        action: "accept",
        ok: accepted.ok,
        reason: acceptReason,
        sessionId: acceptedSessionId,
      });
    });

    socket.on("cancel_waitlist", async (payload: unknown) => {
      const parsed = cancelWaitlistPayload.safeParse(payload);
      if (!parsed.success || user.role === "astrologer") {
        return;
      }
      const { waitlistId } = parsed.data;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const rowResult = await client.query<{
          id: string;
          astrologer_id: string;
          position: number;
          status: string;
          astrologer_user_id: string;
        }>(
          `SELECT w.id,
                  w.astrologer_id,
                  w.position,
                  w.status,
                  a.user_id AS astrologer_user_id
           FROM astrologer_waitlist w
           INNER JOIN astrologers a ON a.id = w.astrologer_id
           WHERE w.id = $1
             AND w.user_id = $2
           FOR UPDATE`,
          [waitlistId, user.userId]
        );
        const row = rowResult.rows[0];
        if (!row || row.status !== "waiting") {
          await client.query("ROLLBACK");
          socket.emit("waitlist_cancelled", {
            waitlistId,
            ok: false,
            reason: "waitlist_not_available",
          });
          return;
        }

        await client.query(
          `UPDATE astrologer_waitlist
           SET status = 'cancelled',
               updated_at = now()
           WHERE id = $1`,
          [row.id]
        );
        await reorderWaitlistAfterRemoval(client, row.astrologer_id, row.position);
        await client.query("COMMIT");
        await emitWaitlistUpdated(io, row.astrologer_user_id, row.astrologer_id);
        await emitQueuePositionUpdates(io, row.astrologer_id);
        socket.emit("waitlist_cancelled", {
          waitlistId: row.id,
          astrologerId: row.astrologer_id,
          ok: true,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        console.error("cancel_waitlist failed:", err);
      } finally {
        client.release();
      }
    });

    socket.on("get_waitlist", async () => {
      if (user.role !== "astrologer") {
        return;
      }
      const astroResult = await pool.query<{
        astrologer_id: string;
      }>(
        `SELECT id AS astrologer_id
         FROM astrologers
         WHERE user_id = $1
         LIMIT 1`,
        [user.userId]
      );
      const astro = astroResult.rows[0];
      if (!astro) {
        return;
      }
      const queue = await loadAstrologerQueue(astro.astrologer_id);
      socket.emit("waitlist_data", {
        queue: queue.map((row) => ({
          waitlistId: row.id,
          userId: row.user_id,
          userName: row.user_name,
          position: row.position,
        })),
      });
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

      if (session.status === "waiting") {
        ensureWaitingSessionTimeout(io, sessionId);
      } else {
        clearWaitingSessionTimeout(sessionId);
      }

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
          clearWaitingSessionTimeout(sessionId);
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
      if (uid === session.user_id) {
        state.userMessageCount = (state.userMessageCount ?? 0) + 1;
      } else if (uid === session.astrologer_user_id) {
        state.astrologerMessageCount = (state.astrologerMessageCount ?? 0) + 1;
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

    socket.on("initiate_call", async (payload: unknown) => {
      const parsed = initiateCallPayload.safeParse(payload);
      if (!parsed.success) {
        return;
      }
      const { sessionId, callType } = parsed.data;

      // Only accept calls for active sessions.
      const session = await loadCallSessionRow(sessionId);
      if (!session || session.status !== "active") {
        return;
      }

      const callerUserId = user.userId;
      const isUserCaller = callerUserId === session.user_id;
      const isAstrologerCaller = callerUserId === session.astrologer_user_id;
      if (!isUserCaller && !isAstrologerCaller) {
        return;
      }

      const otherUserId = isUserCaller ? session.astrologer_user_id : session.user_id;
      const callerName = isUserCaller ? session.user_name : session.astrologer_name;

      const channelName = generateChannelName(sessionId);
      const appId = process.env.AGORA_APP_ID ?? "";

      if (!appId) {
        return;
      }

      // Generate tokens for both parties (publisher role).
      const userToken = generateAgoraToken(channelName, 1, "publisher");
      const astrologerToken = generateAgoraToken(channelName, 2, "publisher");
      void userToken;
      void astrologerToken;

      await pool.query(
        `UPDATE chat_sessions
         SET session_type = $1,
             call_channel_name = $2
         WHERE id = $3`,
        [callType, channelName, sessionId]
      );

      // Clear any previous pending timers for this session.
      const existing = pendingCalls.get(sessionId);
      if (existing) {
        clearTimeout(existing.timeout);
        pendingCalls.delete(sessionId);
      }

      // Auto-decline if the other party doesn't respond in 30s.
      const timeout = setTimeout(async () => {
        const pending = pendingCalls.get(sessionId);
        if (!pending) {
          return;
        }

        pendingCalls.delete(sessionId);

        await pool.query(
          `UPDATE chat_sessions
           SET session_type = 'chat',
               call_channel_name = NULL
           WHERE id = $1`,
          [sessionId]
        );

        io.to(`user:${pending.callerUserId}`).emit("call_declined", {
          sessionId,
          callType: pending.callType,
          channelName: pending.channelName,
        });
        io.to(`user:${pending.otherUserId}`).emit("call_declined", {
          sessionId,
          callType: pending.callType,
          channelName: pending.channelName,
        });
      }, 30_000);

      pendingCalls.set(sessionId, {
        timeout,
        callerUserId,
        otherUserId,
        callType,
        channelName,
      });

      const callerUid = isUserCaller ? 1 : 2;
      const token = generateAgoraToken(channelName, callerUid, "publisher");

      io.to(`user:${otherUserId}`).emit("incoming_call", {
        sessionId,
        callType,
        channelName,
        callerName,
        appId,
        pricePerMinute: Number(session.price_per_minute ?? 0),
      });
      socket.emit("call_ready", {
        channelName,
        token,
        uid: callerUid,
        appId,
        callType,
        pricePerMinute: Number(session.price_per_minute ?? 0),
      });
    });

    socket.on("accept_call", async (payload: unknown) => {
      const parsed = sessionIdPayload.safeParse(payload);
      if (!parsed.success) {
        return;
      }

      const { sessionId } = parsed.data;
      const session = await loadCallSessionRow(sessionId);
      if (!session || session.status !== "active") {
        return;
      }

      const accepterUserId = user.userId;
      const isAccepterUser = accepterUserId === session.user_id;
      const isAccepterAstrologer = accepterUserId === session.astrologer_user_id;
      if (!isAccepterUser && !isAccepterAstrologer) {
        return;
      }

      const callerUserId = isAccepterUser ? session.astrologer_user_id : session.user_id;

      const channelName =
        session.call_channel_name ?? generateChannelName(sessionId);
      const appId = process.env.AGORA_APP_ID ?? "";
      if (!appId) {
        return;
      }

      const accepterUid = isAccepterUser ? 1 : 2;
      const token = generateAgoraToken(channelName, accepterUid, "publisher");

      // Clear pending auto-decline timer.
      const pending = pendingCalls.get(sessionId);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingCalls.delete(sessionId);
      }

      // Mark both parties as "communicated" so the existing billing logic
      // (which relies on message counts) charges for the call time.
      const liveState = ensureLiveSession(sessionId);
      liveState.userMessageCount = 1;
      liveState.astrologerMessageCount = 1;

      const callType = (session.session_type ?? "voice") as "voice" | "video";

      socket.emit("call_ready", {
        channelName,
        token,
        uid: accepterUid,
        appId,
        callType,
        pricePerMinute: Number(session.price_per_minute ?? 0),
      });
      io.to(`user:${callerUserId}`).emit("call_accepted", {
        channelName,
      });
    });

    socket.on("decline_call", async (payload: unknown) => {
      const parsed = sessionIdPayload.safeParse(payload);
      if (!parsed.success) {
        return;
      }
      const { sessionId } = parsed.data;

      const session = await loadCallSessionRow(sessionId);
      if (!session || session.status !== "active") {
        return;
      }

      const declinerUserId = user.userId;
      const isDeclinerUser = declinerUserId === session.user_id;
      const isDeclinerAstrologer = declinerUserId === session.astrologer_user_id;
      if (!isDeclinerUser && !isDeclinerAstrologer) {
        return;
      }

      const callerUserId = isDeclinerUser ? session.astrologer_user_id : session.user_id;
      const otherUserId = isDeclinerUser ? session.user_id : session.astrologer_user_id;

      const pending = pendingCalls.get(sessionId);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingCalls.delete(sessionId);
      }

      await pool.query(
        `UPDATE chat_sessions
         SET session_type = 'chat',
             call_channel_name = NULL
         WHERE id = $1`,
        [sessionId]
      );

      io.to(`user:${callerUserId}`).emit("call_declined", { sessionId });
      io.to(`user:${otherUserId}`).emit("call_declined", { sessionId });
    });

    socket.on("end_call", async (payload: unknown) => {
      const parsed = sessionIdPayload.safeParse(payload);
      if (!parsed.success) {
        return;
      }
      const { sessionId } = parsed.data;

      const session = await loadCallSessionRow(sessionId);
      if (!session || session.status !== "active") {
        return;
      }

      const uid = user.userId;
      const isParticipant = uid === session.user_id || uid === session.astrologer_user_id;
      if (!isParticipant) {
        return;
      }

      const callerUserId = session.user_id;
      const otherUserId = session.astrologer_user_id;

      const pending = pendingCalls.get(sessionId);
      if (pending) {
        clearTimeout(pending.timeout);
        pendingCalls.delete(sessionId);
      }

      const channelName = session.call_channel_name ?? generateChannelName(sessionId);

      await pool.query(
        `UPDATE chat_sessions
         SET session_type = 'chat',
             call_channel_name = NULL
         WHERE id = $1`,
        [sessionId]
      );

      io.to(`user:${callerUserId}`).emit("call_ended", { sessionId, channelName });
      io.to(`user:${otherUserId}`).emit("call_ended", { sessionId, channelName });
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
         SET status = 'cancelled',
             ended_at = now(),
             total_minutes = 0,
             total_charged = 0
         WHERE id = $1 AND status = 'waiting'`,
        [sessionId]
      );
      clearWaitingSessionTimeout(sessionId);
      stopSessionTimer(sessionId);
      liveSessions.delete(sessionId);

      io.to(sessionId).emit("session_cancelled", {
        sessionId,
        reason: "astrologer_unavailable",
      });
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
