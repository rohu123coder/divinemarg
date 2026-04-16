"use client";

import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";

import { Navbar } from "@/components/Navbar";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const AgoraCallScreen = dynamic(
  () => import("@/components/AgoraCallScreen").then((m) => m.AgoraCallScreen),
  { ssr: false }
);

type ChatMessage = {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: "user" | "astrologer";
  content: string;
  createdAt: string;
};

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
    "http://localhost:4000"
  );
}

type ChatSessionClientProps = {
  sessionId: string;
};

export function ChatSessionClient({ sessionId }: ChatSessionClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawName = searchParams.get("name");
  const astrologerName = rawName
    ? decodeURIComponent(rawName)
    : "Astrologer";

  const headerInitials = useMemo(() => {
    const parts = astrologerName.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "?";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [astrologerName]);

  const [headerPhoto, setHeaderPhoto] = useState<string | null>(null);

  const { user, token, isLoggedIn, refreshWalletBalance } = useAuthStore();
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
  const [callInitiated, setCallInitiated] = useState(false);
  const callInitiatedRef = useRef(false);

  const autoInitiateDoneRef = useRef(false);

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
    setCallInitiated(false);
    callInitiatedRef.current = false;
    autoInitiateDoneRef.current = false;
  }, [sessionId]);

  useEffect(() => {
    setHeaderPhoto(null);
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.get(`/api/sessions/${sessionId}/context`);
        const url = res.data?.data?.profile_photo_url as string | undefined;
        if (!cancelled && url) {
          setHeaderPhoto(url);
        }
      } catch {
        // optional
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !token || !sessionId || !isLoggedIn) {
      return;
    }

    const socket = io(apiBase(), {
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
          void refreshWalletBalance();
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
        void refreshWalletBalance();
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
      setCallInitiated(false);
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
      setCallInitiated(callInitiatedRef.current);
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
      setCallInitiated(false);
      setCallUi((prev) => {
        if (!prev) return prev;
        if (prev.phase !== "calling") return prev;
        return { ...prev, phase: "active" };
      });
    });

    socket.on("call_declined", () => {
      setToast("Call declined");
      setCallInitiated(false);
      callInitiatedRef.current = false;
      setCallUi(null);
    });

    socket.on("call_ended", () => {
      setCallInitiated(false);
      callInitiatedRef.current = false;
      setCallUi(null);
    });

    socket.on("insufficient_balance", () => {
      setToast(
        "Your wallet balance is too low to continue this session. The chat will end."
      );
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mounted, token, sessionId, isLoggedIn, user?.id, refreshWalletBalance]);

  const autoCall =
    searchParams.get("autoCall") ?? searchParams.get("callType");

  const initiateCall = useCallback(
    (callType: CallType) => {
      if (!socketRef.current) return;
      if (status !== "active") return;
      if (callUi || callInitiatedRef.current) return;
      socketRef.current.emit("initiate_call", { sessionId, callType });
      setCallInitiated(true);
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
    setCallInitiated(false);
    callInitiatedRef.current = false;
    setCallUi(null);
  }, [sessionId]);

  useEffect(() => {
    if (!mounted) return;
    if (status !== "active") return;
    if (autoInitiateDoneRef.current) return;
    if (!autoCall) return;

    if (autoCall === "voice" || autoCall === "video") {
      autoInitiateDoneRef.current = true;
      const t = setTimeout(() => {
        initiateCall(autoCall);
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [mounted, status, autoCall, initiateCall]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (!isLoggedIn || !token) {
      router.replace("/login");
    }
  }, [mounted, isLoggedIn, token, router]);

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

  const endChat = useCallback(() => {
    if (!socketRef.current) {
      return;
    }
    if (!window.confirm("End this chat session? Billing will be finalized.")) {
      return;
    }
    socketRef.current.emit("end_session", { sessionId });
  }, [sessionId]);

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

  if (!mounted || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Navbar />

      {toast ? (
        <div className="fixed bottom-20 left-1/2 z-[90] w-[min(90vw,28rem)] -translate-x-1/2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-lg ring-1 ring-amber-200">
          {toast}
        </div>
      ) : null}

      <header className="sticky top-16 z-10 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {headerPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headerPhoto}
                alt=""
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-violet-100"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-400 text-sm font-bold text-white ring-2 ring-violet-100">
                {headerInitials}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900">
                {astrologerName}
              </h1>
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
          </div>
          <div className="flex items-center gap-2">
            {status === "active" ? (
              <>
                <button
                  type="button"
                  onClick={() => initiateCall("voice")}
                  disabled={!!callUi || callInitiated}
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
                  disabled={!!callUi || callInitiated}
                  className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="mr-2" aria-hidden>
                    📹
                  </span>
                  Video
                </button>
              </>
            ) : null}
            {callInitiated ? (
              <span className="text-xs font-semibold text-violet-700">Calling...</span>
            ) : null}
            <button
              type="button"
              onClick={endChat}
              disabled={
                status === "ended" ||
                status === "cancelled" ||
                status === "connecting"
              }
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              End Chat
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-2 pb-28 pt-4 sm:px-4">
        {status === "waiting" ? (
          <p className="mb-3 text-center text-sm text-slate-600">
            Waiting for the astrologer to join…
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
            <p className="text-xs italic text-slate-500">
              Astrologer is typing…
            </p>
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
                status === "active"
                  ? "Type a message…"
                  : "Chat not active yet"
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
              Thank you for chatting with {astrologerName}.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-800">
              <li className="flex justify-between">
                <span className="text-slate-500">Total time</span>
                <span className="font-semibold">
                  {summary.totalMinutes} min
                </span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Amount charged</span>
                <span className="font-semibold">
                  ₹{Number(summary.totalCharged).toFixed(0)}
                </span>
              </li>
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3 text-sm font-semibold text-white"
              onClick={() => router.replace("/dashboard")}
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
          astrologerName={astrologerName}
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
    </div>
  );
}
