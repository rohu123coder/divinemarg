"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { AstrologerNavbar } from "@/components/AstrologerNavbar";
import api from "@/lib/api";
import { getSocketApiBase } from "@/lib/socketBase";
import { useAuthStore } from "@/lib/store";

type DashboardData = {
  earnings_today: number;
  earnings_total: number;
  earnings_this_month: number;
  total_sessions: number;
  rating: number | null;
  total_reviews: number;
  is_available: boolean;
};

type IncomingRequest = {
  sessionId: string;
  userId: string;
  userName: string;
};

type WaitlistEntry = {
  waitlistId: string;
  userId: string;
  userName: string;
  position: number;
};

export default function AstrologerDashboardPage() {
  const router = useRouter();
  const { user, token, isLoggedIn } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [dash, setDash] = useState<DashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState<string | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [incoming, setIncoming] = useState<IncomingRequest | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [waitlistNotice, setWaitlistNotice] = useState<WaitlistEntry | null>(null);
  const [waitlistQueue, setWaitlistQueue] = useState<WaitlistEntry[]>([]);
  const [waitlistCollapsed, setWaitlistCollapsed] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const incomingRef = useRef<IncomingRequest | null>(null);

  const loadDashboard = useCallback(async () => {
    setDashLoading(true);
    setDashError(null);
    try {
      const res = await api.get(`/api/astrologers/dashboard`);
      const d = res.data?.data as DashboardData | undefined;
      if (!d) {
        throw new Error("Invalid response");
      }
      setDash(d);
    } catch {
      setDashError("Could not load dashboard");
    } finally {
      setDashLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (!isLoggedIn || !token) {
      router.replace("/astrologer/login");
      return;
    }
    if (user?.role === "astrologer" && user?.isApproved === false) {
      router.replace("/astrologer/pending");
      return;
    }
    if (user?.role !== "astrologer") {
      router.replace("/dashboard");
      return;
    }
    void loadDashboard();
  }, [mounted, isLoggedIn, token, user?.role, user?.isApproved, router, loadDashboard]);

  useEffect(() => {
    if (!mounted || !token || !isLoggedIn || user?.role !== "astrologer") {
      return;
    }
    if (user?.isApproved === false) {
      router.replace("/astrologer/pending");
      return;
    }

    const socket = io(getSocketApiBase(), {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    const rejoinUserRoom = () => {
      socket.emit("join_user_room");
    };

    socket.on("connect", rejoinUserRoom);
    socket.io.on("reconnect", rejoinUserRoom);
    socket.on("connect", () => {
      socket.emit("get_waitlist");
    });

    socket.on("incoming_request", (payload: IncomingRequest) => {
      incomingRef.current = payload;
      setIncoming(payload);
      setCountdown(30);
    });

    socket.on("waitlist_request", (payload: WaitlistEntry) => {
      setWaitlistNotice(payload);
    });

    socket.on("waitlist_updated", (payload: { queue: WaitlistEntry[] }) => {
      setWaitlistQueue(payload.queue ?? []);
    });

    socket.on("waitlist_data", (payload: { queue: WaitlistEntry[] }) => {
      setWaitlistQueue(payload.queue ?? []);
    });

    socket.on("waitlist_ready", (payload: { queue: WaitlistEntry[] }) => {
      setWaitlistQueue(payload.queue ?? []);
      setWaitlistCollapsed(false);
    });

    socket.on(
      "waitlist_session_started",
      (payload: { sessionId: string; userName: string }) => {
        const q = encodeURIComponent(payload.userName);
        router.push(`/astrologer/chat/${payload.sessionId}?name=${q}`);
      }
    );

    socket.on("disconnect", () => {
      // Keep any active incoming request visible across transient disconnects.
      if (incomingRef.current) {
        setIncoming(incomingRef.current);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mounted, token, isLoggedIn, user?.role, user?.isApproved, router]);

  useEffect(() => {
    if (!incoming) {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      return;
    }
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          const s = socketRef.current;
          const inc = incomingRef.current;
          if (s && inc) {
            s.emit("decline_request", { sessionId: inc.sessionId });
          }
          incomingRef.current = null;
          setIncoming(null);
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [incoming]);

  const setAvailability = async (is_available: boolean) => {
    if (!dash) {
      return;
    }
    setAvailLoading(true);
    try {
      await api.put(`/api/astrologers/availability`, { is_available });
      setDash({ ...dash, is_available });
    } finally {
      setAvailLoading(false);
    }
  };

  const onAccept = () => {
    if (!incoming || !socketRef.current) {
      return;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    const { sessionId, userName } = incoming;
    incomingRef.current = null;
    socketRef.current.emit("join_session", { sessionId });
    setIncoming(null);
    const q = encodeURIComponent(userName);
    router.push(`/astrologer/chat/${sessionId}?name=${q}`);
  };

  const onDecline = () => {
    if (!incoming || !socketRef.current) {
      return;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    incomingRef.current = null;
    socketRef.current.emit("decline_request", { sessionId: incoming.sessionId });
    setIncoming(null);
  };

  const sendWaitlistAction = useCallback(
    (waitlistId: string, action: "accept" | "decline" | "already_added") => {
      if (!socketRef.current) {
        return;
      }
      socketRef.current.emit("waitlist_action", { waitlistId, action });
      if (action !== "accept") {
        setWaitlistNotice((prev) =>
          prev?.waitlistId === waitlistId ? null : prev
        );
      }
    },
    []
  );

  const acceptFromQueue = useCallback((entry: WaitlistEntry) => {
    if (!socketRef.current) {
      return;
    }
    socketRef.current.emit("accept_from_waitlist", {
      waitlistId: entry.waitlistId,
      userId: entry.userId,
    });
  }, []);

  const stars = useMemo(() => {
    const r = dash?.rating;
    if (r == null) {
      return "—";
    }
    return `${r.toFixed(1)} ★`;
  }, [dash?.rating]);

  if (
    !mounted ||
    !isLoggedIn ||
    user?.role !== "astrologer" ||
    user?.isApproved === false
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AstrologerNavbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Welcome back{user?.name ? `, ${user.name}` : ""}.
        </p>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Availability
              </h2>
              <p className="text-sm text-slate-600">
                {dash?.is_available
                  ? "You appear online to new chat requests."
                  : "You are offline — users won’t reach you for new chats."}
              </p>
            </div>
            <button
              type="button"
              disabled={dashLoading || availLoading || !dash}
              onClick={() => {
                if (dash) {
                  void setAvailability(!dash.is_available);
                }
              }}
              className={`relative h-14 w-28 shrink-0 rounded-full transition ${
                dash?.is_available
                  ? "bg-emerald-500 shadow-inner"
                  : "bg-slate-300"
              } disabled:opacity-50`}
              aria-pressed={dash?.is_available ?? false}
            >
              <span
                className={`absolute top-1 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xs font-bold shadow-md transition-all ${
                  dash?.is_available ? "left-[calc(100%-3.25rem)]" : "left-1"
                }`}
              >
                {dash?.is_available ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </section>

        {dashLoading ? (
          <div className="mt-8 flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : dashError ? (
          <p className="mt-8 text-center text-sm text-red-600">{dashError}</p>
        ) : dash ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Today&apos;s earnings
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ₹{dash.earnings_today.toFixed(0)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total sessions
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {dash.total_sessions}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Average rating
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stars}</p>
              <p className="text-xs text-slate-500">
                {dash.total_reviews} reviews
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                This month
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ₹{dash.earnings_this_month.toFixed(0)}
              </p>
            </div>
          </div>
        ) : null}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setWaitlistCollapsed((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-base font-semibold text-slate-900">
              Waiting Queue ({waitlistQueue.length})
            </h2>
            <span className="text-sm text-slate-500">
              {waitlistCollapsed ? "Show" : "Hide"}
            </span>
          </button>
          {!waitlistCollapsed ? (
            waitlistQueue.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {waitlistQueue.map((entry) => (
                  <li
                    key={entry.waitlistId}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        #{entry.position} {entry.userName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => acceptFromQueue(entry)}
                      disabled={Boolean(incoming)}
                      className="rounded-lg bg-gradient-to-r from-purple-600 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No users in waitlist.</p>
            )
          ) : null}
        </section>
      </main>

      {incoming ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">New chat request</h2>
            <p className="mt-3 text-sm text-slate-700">
              New Chat Request from{" "}
              <span className="font-semibold">{incoming.userName}</span>
            </p>
            <p className="mt-4 text-center text-3xl font-mono font-bold text-violet-700">
              {countdown}s
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onDecline}
                className="flex-1 rounded-xl border border-slate-300 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3 text-sm font-semibold text-white"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {waitlistNotice ? (
        <div className="fixed left-1/2 top-24 z-[95] w-[min(92vw,42rem)] -translate-x-1/2 rounded-2xl border border-violet-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-slate-900">
            New request from {waitlistNotice.userName}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Queue position #{waitlistNotice.position}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => sendWaitlistAction(waitlistNotice.waitlistId, "accept")}
              className="rounded-lg bg-gradient-to-r from-purple-600 to-orange-500 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() =>
                sendWaitlistAction(waitlistNotice.waitlistId, "already_added")
              }
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-800"
            >
              Add to Waitlist
            </button>
            <button
              type="button"
              onClick={() => sendWaitlistAction(waitlistNotice.waitlistId, "decline")}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
            >
              Decline
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
