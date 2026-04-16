"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";

import { AstrologerNavbar } from "@/components/AstrologerNavbar";
import { AgoraCallScreen } from "@/components/AgoraCallScreen";
import { getSocketApiBase } from "@/lib/socketBase";
import { useAuthStore } from "@/lib/store";

type ChatMessage = {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: "user" | "astrologer";
  content: string;
  createdAt: string;
};

type WaitlistEntry = {
  waitlistId: string;
  userId: string;
  userName: string;
  position: number;
};

type Props = { sessionId: string };

export function AstrologerChatClient({ sessionId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawName = searchParams.get("name");
  const peerName = rawName
    ? decodeURIComponent(rawName)
    : "User";

  const { user, token, isLoggedIn } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<string>("connecting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [summary, setSummary] = useState<{
    totalMinutes: number;
    totalCharged: number;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  type CallType = "voice" | "video";
  type CallUiState =
    | {
        phase: "incoming";
        callType: CallType;
        channelName: string;
        appId: string;
        callerName: string;
        pricePerMinute?: number;
      }
    | {
        phase: "calling" | "active";
        callType: CallType;
        channelName: string;
        token: string;
        uid: number;
        appId: string;
        pricePerMinute?: number;
      };

  type IncomingCallPayload = {
    sessionId: string;
    callType: CallType;
    channelName: string;
    callerName: string;
    appId: string;
    pricePerMinute?: number;
  };

  type CallReadyPayload = {
    channelName: string;
    token: string;
    uid: number;
    appId: string;
    callType?: CallType;
    pricePerMinute?: number;
  };

  const [callUi, setCallUi] = useState<CallUiState | null>(null);
  const callInitiatedRef = useRef(false);
  const [waitlistNotice, setWaitlistNotice] = useState<WaitlistEntry | null>(null);
  const [waitlistQueue, setWaitlistQueue] = useState<WaitlistEntry[]>([]);
  const [waitlistCollapsed, setWaitlistCollapsed] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const summaryShownRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    summaryShownRef.current = false;
    setSummary(null);
    setMessages([]);
    setStatus("connecting");
    setElapsedSec(0);
    cancelledRef.current = false;
    setCallUi(null);
    callInitiatedRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !token || !sessionId || !isLoggedIn) {
      return;
    }
    if (user?.role !== "astrologer") {
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

    socket.on("connect", () => {
      socket.emit("join_session", { sessionId });
      socket.emit("get_waitlist");
    });

    socket.on("connect_error", () => {
      setStatus("error");
    });

    socket.on(
      "joined_session",
      (payload: { sessionId: string; status: string }) => {
        if (payload.sessionId !== sessionId) {
          return;
        }
        setStatus(payload.status);
      }
    );

    socket.on(
      "session_started",
      (payload: { sessionId: string; startedAt: string }) => {
        if (payload.sessionId !== sessionId) {
          return;
        }
        setStatus("active");
        cancelledRef.current = false;
      }
    );

    socket.on(
      "session_tick",
      ({
        elapsedSeconds,
      }: {
        elapsedSeconds: number;
      }) => {
        setElapsedSec(Math.max(0, elapsedSeconds ?? 0));
      }
    );

    socket.on("new_message", (msg: ChatMessage) => {
      if (msg.sessionId !== sessionId) {
        return;
      }
      setMessages((prev) => [...prev, msg]);
    });

    socket.on(
      "user_typing",
      (payload: { userId: string; sessionId: string }) => {
        if (payload.sessionId !== sessionId) {
          return;
        }
        if (payload.userId === user?.id) {
          return;
        }
        setTyping(true);
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 2500);
      }
    );

    socket.on(
      "session_cancelled",
      (payload: { sessionId?: string; reason?: string }) => {
        if (payload.sessionId && payload.sessionId !== sessionId) {
          return;
        }
        if (payload.reason === "astrologer_unavailable") {
          cancelledRef.current = true;
          summaryShownRef.current = true;
          setSummary(null);
          setStatus("cancelled");
          setToast("Astrologer unavailable, no charge deducted");
        }
      }
    );

    socket.on(
      "session_ended",
      (payload: {
        sessionId: string;
        duration?: number;
        charge?: number;
        astrologerName?: string;
        totalMinutes: number;
        totalCharged: number;
      }) => {
        if (payload.sessionId !== sessionId) {
          return;
        }
        if (cancelledRef.current) {
          return;
        }
        setStatus("ended");
        if (!summaryShownRef.current) {
          summaryShownRef.current = true;
          const duration = payload.duration ?? payload.totalMinutes ?? 0;
          const charge = payload.charge ?? payload.totalCharged ?? 0;
          setSummary({
            totalMinutes: duration,
            totalCharged: charge,
          });
        }
      }
    );

    socket.on("incoming_call", (data: IncomingCallPayload) => {
      if (!data || data.sessionId !== sessionId) return;
      callInitiatedRef.current = false;
      setCallUi({
        phase: "incoming",
        callType: data.callType as CallType,
        channelName: data.channelName,
        appId: data.appId,
        callerName: data.callerName,
        pricePerMinute: data.pricePerMinute,
      });
    });

    socket.on("call_ready", (data: CallReadyPayload) => {
      if (!data) return;
      const nextPhase = callInitiatedRef.current ? "calling" : "active";
      setCallUi({
        phase: nextPhase,
        callType: (data.callType ?? "voice") as CallType,
        channelName: data.channelName,
        token: data.token,
        uid: data.uid,
        appId: data.appId,
        pricePerMinute: data.pricePerMinute,
      });
    });

    socket.on("call_accepted", () => {
      setToast("Call accepted");
      setCallUi((prev) => {
        if (!prev) return prev;
        if (prev.phase !== "calling") return prev;
        return { ...prev, phase: "active" };
      });
    });

    socket.on("call_declined", () => {
      setToast("Call declined");
      callInitiatedRef.current = false;
      setCallUi(null);
    });

    socket.on("call_ended", () => {
      callInitiatedRef.current = false;
      setCallUi(null);
    });

    socket.on("insufficient_balance", () => {
      setToast(
        "The user’s wallet balance is too low to continue. This session may end shortly."
      );
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

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mounted, token, sessionId, isLoggedIn, user?.id, user?.role, router]);

  const initiateCall = useCallback(
    (callType: CallType) => {
      if (!socketRef.current) return;
      if (status !== "active") return;
      if (callUi) return;
      socketRef.current.emit("initiate_call", { sessionId, callType });
      callInitiatedRef.current = true;
    },
    [callUi, sessionId, status]
  );

  const acceptIncomingCall = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("accept_call", { sessionId });
  }, [sessionId]);

  const declineIncomingCall = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("decline_call", { sessionId });
  }, [sessionId]);

  const endCall = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("end_call", { sessionId });
    callInitiatedRef.current = false;
    setCallUi(null);
  }, [sessionId]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (!isLoggedIn || !token) {
      router.replace("/astrologer/login");
      return;
    }
    if (user?.role !== "astrologer") {
      router.replace("/dashboard");
    }
  }, [mounted, isLoggedIn, token, user?.role, router]);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || !socketRef.current || status !== "active") {
      return;
    }
    socketRef.current.emit("send_message", {
      sessionId,
      content: text,
    });
    setInput("");
  }, [input, sessionId, status]);

  const sendTyping = useCallback(() => {
    if (!socketRef.current || status !== "active") {
      return;
    }
    socketRef.current.emit("typing", { sessionId });
  }, [sessionId, status]);

  const endSession = useCallback(() => {
    if (!socketRef.current) {
      return;
    }
    if (
      !window.confirm("End this session? Billing will be finalized for the user.")
    ) {
      return;
    }
    socketRef.current.emit("end_session", { sessionId });
  }, [sessionId]);

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

  function formatTimer(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const statusBadge = useMemo(() => {
    const base =
      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize";
    if (status === "active") {
      return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100`;
    }
    if (status === "waiting") {
      return `${base} bg-amber-50 text-amber-800 ring-1 ring-amber-100`;
    }
    if (status === "ended") {
      return `${base} bg-slate-100 text-slate-600 ring-1 ring-slate-200`;
    }
    if (status === "cancelled") {
      return `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-100`;
    }
    return `${base} bg-violet-50 text-violet-800 ring-1 ring-violet-100`;
  }, [status]);

  if (!mounted || !isLoggedIn || user?.role !== "astrologer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AstrologerNavbar />

      {toast ? (
        <div className="fixed bottom-20 left-1/2 z-[90] w-[min(90vw,28rem)] -translate-x-1/2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-lg ring-1 ring-amber-200">
          {toast}
        </div>
      ) : null}

      <header className="sticky top-16 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{peerName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span className={statusBadge}>{status}</span>
              <span>
                Timer:{" "}
                <span className="font-semibold text-slate-900">
                  {status === "active" ? formatTimer(elapsedSec) : "—"}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === "active" ? (
              <>
                <button
                  type="button"
                  onClick={() => initiateCall("voice")}
                  disabled={!!callUi}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="mr-2" aria-hidden>
                    📞
                  </span>
                  Voice
                </button>
                <button
                  type="button"
                  onClick={() => initiateCall("video")}
                  disabled={!!callUi}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="mr-2" aria-hidden>
                    📹
                  </span>
                  Video
                </button>
              </>
            ) : null}
            <button
              type="button"
              onClick={endSession}
              disabled={
                status === "ended" ||
                status === "cancelled" ||
                status === "connecting"
              }
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              End Session
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-2 pb-28 pt-4 sm:px-4">
        <section className="mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setWaitlistCollapsed((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-sm font-semibold text-slate-900">
              Waiting Queue ({waitlistQueue.length})
            </h2>
            <span className="text-xs text-slate-500">
              {waitlistCollapsed ? "Show" : "Hide"}
            </span>
          </button>
          {!waitlistCollapsed ? (
            waitlistQueue.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {waitlistQueue.map((entry) => (
                  <li
                    key={entry.waitlistId}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2"
                  >
                    <p className="text-xs font-semibold text-slate-900">
                      #{entry.position} {entry.userName}
                    </p>
                    <button
                      type="button"
                      onClick={() => acceptFromQueue(entry)}
                      disabled={status === "active"}
                      className="rounded-lg bg-gradient-to-r from-purple-600 to-orange-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-600">No users in queue.</p>
            )
          ) : null}
        </section>

        {status === "waiting" ? (
          <p className="mb-3 text-center text-sm text-slate-600">
            Waiting for the user to connect…
          </p>
        ) : null}

        <div
          ref={listRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner"
          style={{ maxHeight: "calc(100vh - 14rem)" }}
        >
          {messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              No messages yet. Say hello!
            </p>
          ) : null}
          {messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    mine
                      ? "rounded-br-md bg-gradient-to-br from-purple-600 to-violet-600 text-white"
                      : "rounded-bl-md bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      mine ? "text-white/70" : "text-slate-400"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          {typing ? (
            <p className="text-xs italic text-slate-500">User is typing…</p>
          ) : null}
        </div>

        <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-3 backdrop-blur sm:static sm:mt-4 sm:border-0 sm:bg-transparent sm:p-0">
          <div className="mx-auto flex max-w-3xl gap-2">
            <input
              type="text"
              value={input}
              disabled={status !== "active"}
              onChange={(e) => {
                setInput(e.target.value);
                sendTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                status === "active" ? "Type a message…" : "Chat not active yet"
              }
              className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-violet-500 focus:ring-2 disabled:bg-slate-50"
            />
            <button
              type="button"
              disabled={status !== "active" || !input.trim()}
              onClick={sendMessage}
              className="rounded-2xl bg-gradient-to-r from-purple-600 to-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </main>

      {summary ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Session ended</h2>
            <p className="mt-3 text-sm text-slate-600">
              Your chat with {peerName} has ended.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-800">
              <li className="flex justify-between">
                <span className="text-slate-500">Total time</span>
                <span className="font-semibold">{summary.totalMinutes} min</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">User charged</span>
                <span className="font-semibold">
                  ₹{Number(summary.totalCharged).toFixed(0)}
                </span>
              </li>
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3 text-sm font-semibold text-white"
              onClick={() => router.replace("/astrologer/dashboard")}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      ) : null}

      {callUi ? (
        <AgoraCallScreen
          phase={callUi.phase}
          channelName={callUi.channelName}
          token={"token" in callUi ? callUi.token : ""}
          uid={"uid" in callUi ? callUi.uid : 0}
          appId={callUi.appId}
          callType={callUi.callType}
          astrologerName={peerName}
          callerName={"callerName" in callUi ? callUi.callerName : undefined}
          elapsedSeconds={elapsedSec}
          pricePerMinute={callUi.pricePerMinute}
          autoDeclineSeconds={30}
          onAcceptCall={callUi.phase === "incoming" ? acceptIncomingCall : undefined}
          onDeclineCall={
            callUi.phase === "incoming" ? declineIncomingCall : undefined
          }
          onEndCall={endCall}
        />
      ) : null}

      {waitlistNotice ? (
        <div className="fixed left-1/2 top-24 z-[95] w-[min(92vw,40rem)] -translate-x-1/2 rounded-2xl border border-violet-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-slate-900">
            {waitlistNotice.userName} wants to chat
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
