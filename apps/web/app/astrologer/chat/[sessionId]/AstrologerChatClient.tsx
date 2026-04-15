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
  const [elapsedMin, setElapsedMin] = useState(0);
  const [summary, setSummary] = useState<{
    totalMinutes: number;
    totalCharged: number;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const summaryShownRef = useRef(false);

  useEffect(() => {
    summaryShownRef.current = false;
    setSummary(null);
    setMessages([]);
    setStatus("connecting");
    setElapsedMin(0);
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
      }
    );

    socket.on(
      "session_tick",
      (payload: {
        elapsedMinutes: number;
        elapsedSeconds: number;
      }) => {
        setElapsedMin(Math.max(0, payload.elapsedMinutes ?? 0));
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

    socket.on("insufficient_balance", () => {
      setToast(
        "The user’s wallet balance is too low to continue. This session may end shortly."
      );
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [mounted, token, sessionId, isLoggedIn, user?.id, user?.role]);

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
                  {status === "active" ? `${elapsedMin} min` : "—"}
                </span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={endSession}
            disabled={status === "ended" || status === "connecting"}
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            End Session
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-2 pb-28 pt-4 sm:px-4">
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
    </div>
  );
}
