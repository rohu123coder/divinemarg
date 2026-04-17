"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { Navbar } from "@/components/Navbar";
import { WalletWidget } from "@/components/WalletWidget";
import api from "@/lib/api";
import { getSocketApiBase } from "@/lib/socketBase";
import { useAuthStore } from "@/lib/store";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string;
};

type AstrologerDetail = {
  id: string;
  bio: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  total_reviews: number;
  price_per_minute: number | null;
  is_available: boolean;
  is_busy: boolean;
  waiting_count: number;
  experience_years: number | null;
  user: {
    name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
  };
};

function StarRow({ value }: { value: number }) {
  return (
    <span className="text-amber-500" aria-hidden>
      {"★".repeat(Math.round(value))}
      <span className="text-slate-200">
        {"★".repeat(Math.max(0, 5 - Math.round(value)))}
      </span>
    </span>
  );
}

export default function AstrologerProfilePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { isLoggedIn, user, token } = useAuthStore();
  const [data, setData] = useState<{
    astrologer: AstrologerDetail;
    reviews: Review[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [joinWaitlistLoading, setJoinWaitlistLoading] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [busyPromptOpen, setBusyPromptOpen] = useState(false);
  const [busyQueueLength, setBusyQueueLength] = useState(0);
  const [waitlistState, setWaitlistState] = useState<{
    waitlistId: string;
    position: number;
    queueLength: number;
  } | null>(null);
  const [queueTurn, setQueueTurn] = useState<{
    sessionId: string;
    astrologerName: string;
    countdown: number;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/astrologers/${id}`);
        const d = res.data?.data as {
          astrologer: AstrologerDetail;
          reviews: Review[];
        };
        if (!cancelled && d) {
          setData(d);
        }
      } catch {
        if (!cancelled) {
          setError("Astrologer not found");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!token || !isLoggedIn || user?.role === "astrologer") {
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

    socket.on(
      "waitlist_joined",
      (payload: {
        waitlistId: string;
        position: number;
        queueLength: number;
        astrologerId: string;
      }) => {
        if (payload.astrologerId !== id) {
          return;
        }
        setBusyPromptOpen(false);
        setWaitlistState({
          waitlistId: payload.waitlistId,
          position: payload.position,
          queueLength: payload.queueLength,
        });
      }
    );

    socket.on(
      "queue_position_update",
      (payload: {
        waitlistId?: string;
        astrologerId: string;
        newPosition: number;
        queueLength: number;
      }) => {
        if (payload.astrologerId !== id) {
          return;
        }
        setWaitlistState((prev) => {
          if (!prev) {
            return prev;
          }
          if (payload.waitlistId && payload.waitlistId !== prev.waitlistId) {
            return prev;
          }
          return {
            ...prev,
            position: payload.newPosition,
            queueLength: payload.queueLength,
          };
        });
      }
    );

    socket.on(
      "waitlist_declined",
      (payload: { waitlistId?: string; astrologerId?: string }) => {
        if (payload.astrologerId && payload.astrologerId !== id) {
          return;
        }
        setWaitlistState((prev) => {
          if (!prev) {
            return prev;
          }
          if (payload.waitlistId && payload.waitlistId !== prev.waitlistId) {
            return prev;
          }
          return null;
        });
        setError("Astrologer is unavailable. Try another astrologer.");
      }
    );

    socket.on(
      "waitlist_cancelled",
      (payload: { waitlistId?: string; astrologerId?: string; ok?: boolean }) => {
        if (payload.astrologerId && payload.astrologerId !== id) {
          return;
        }
        setWaitlistState((prev) => {
          if (!prev) {
            return prev;
          }
          if (payload.waitlistId && payload.waitlistId !== prev.waitlistId) {
            return prev;
          }
          return null;
        });
      }
    );

    socket.on(
      "session_starting",
      (payload: { sessionId: string; astrologerName?: string; astrologerId?: string }) => {
        if (payload.astrologerId && payload.astrologerId !== id) {
          return;
        }
        const astrologerName = encodeURIComponent(
          payload.astrologerName ?? data?.astrologer.user.name ?? "Astrologer"
        );
        router.push(`/chat/${payload.sessionId}?name=${astrologerName}`);
      }
    );

    socket.on(
      "queue_your_turn",
      (payload: { sessionId: string; astrologerName?: string; astrologerId?: string }) => {
        if (payload.astrologerId && payload.astrologerId !== id) {
          return;
        }
        setQueueTurn({
          sessionId: payload.sessionId,
          astrologerName: payload.astrologerName ?? data?.astrologer.user.name ?? "Astrologer",
          countdown: 3,
        });
      }
    );

    socket.on(
      "waitlist_updated",
      (payload: {
        astrologerId?: string;
        queue?: Array<{ waitlistId: string; userId: string; position: number }>;
      }) => {
        if (payload.astrologerId && payload.astrologerId !== id) {
          return;
        }
        if (!payload.queue) {
          return;
        }
        setWaitlistState((prev) =>
          prev
            ? (() => {
                const mine = payload.queue?.find(
                  (entry) => entry.waitlistId === prev.waitlistId
                );
                if (!mine) {
                  return null;
                }
                return {
                  ...prev,
                  position: mine.position,
                  queueLength: payload.queue?.length ?? prev.queueLength,
                };
              })()
            : prev
        );
      }
    );

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [data?.astrologer.user.name, id, isLoggedIn, router, token, user?.role]);

  useEffect(() => {
    if (!queueTurn) {
      return;
    }
    if (queueTurn.countdown <= 0) {
      const astrologerName = encodeURIComponent(queueTurn.astrologerName);
      router.push(`/chat/${queueTurn.sessionId}?name=${astrologerName}`);
      return;
    }
    const t = setTimeout(() => {
      setQueueTurn((prev) =>
        prev ? { ...prev, countdown: prev.countdown - 1 } : prev
      );
    }, 1000);
    return () => clearTimeout(t);
  }, [queueTurn, router]);

  const startChat = useCallback(
    async (callType?: "voice" | "video") => {
    if (!data) {
      return;
    }
    if (!isLoggedIn) {
      router.push(`/login?redirect=${encodeURIComponent(`/astrologers/${id}`)}`);
      return;
    }
    const price = data.astrologer.price_per_minute ?? 0;
    const min = price * 5;
    const bal = user?.wallet_balance ?? 0;
    if (bal < min) {
      setRechargeOpen(true);
      return;
    }
    setChatLoading(true);
    try {
      const res = await api.post(`/api/chat/request`, {
        astrologer_id: data.astrologer.id,
      });
      const sessionId = (res.data?.data?.session_id ??
        res.data?.data?.sessionId) as string | undefined;
      if (!sessionId) {
        throw new Error("No session");
      }
      const name = encodeURIComponent(data.astrologer.user.name);
      router.push(
        `/chat/${sessionId}?name=${name}${callType ? `&autoCall=${callType}` : ""}`
      );
    } catch (e: unknown) {
      const maybeStatus =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "status" in e.response
          ? Number(e.response.status)
          : null;
      const responseData =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object"
          ? (e.response.data as {
              data?: { queue_length?: number };
              error?: string;
            })
          : undefined;
      if (maybeStatus === 409 && responseData?.data) {
        setBusyQueueLength(Number(responseData.data.queue_length ?? 0));
        setBusyPromptOpen(true);
        setError(null);
        return;
      }
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "error" in e.response.data
          ? String((e.response.data as { error?: string }).error)
          : "Could not start chat";
      setError(msg);
    } finally {
      setChatLoading(false);
    }
    },
    [data, id, isLoggedIn, router, user?.wallet_balance]
  );

  const joinWaitlist = useCallback(() => {
    if (!data || !socketRef.current) {
      setError("Could not connect to waitlist. Please refresh and try again.");
      return;
    }
    setJoinWaitlistLoading(true);
    socketRef.current.emit("join_waitlist", {
      astrologerId: data.astrologer.id,
    });
    setTimeout(() => setJoinWaitlistLoading(false), 800);
  }, [data]);

  const cancelWaitlist = useCallback(() => {
    if (!waitlistState || !socketRef.current || !data) {
      return;
    }
    socketRef.current.emit("cancel_waitlist", {
      waitlistId: waitlistState.waitlistId,
      astrologerId: data.astrologer.id,
    });
  }, [data, waitlistState]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl animate-pulse px-4 py-10 sm:px-6">
          <div className="h-40 rounded-2xl bg-slate-200" />
          <div className="mt-8 h-64 rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
          <p className="text-slate-700">{error ?? "Not found"}</p>
          <Link
            href="/astrologers"
            className="mt-6 inline-block font-semibold text-violet-600"
          >
            ← Back to astrologers
          </Link>
        </div>
      </div>
    );
  }

  const { astrologer, reviews } = data;
  const price = astrologer.price_per_minute ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 lg:pb-10">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
        {waitlistState ? (
          <section className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-violet-900">You are in queue</h2>
            <p className="mt-2 text-sm text-violet-800">
              You are #{waitlistState.position} in queue for{" "}
              {astrologer.user.name}. Estimated wait: ~
              {Math.max(1, waitlistState.position * 5)} min.
            </p>
            <p className="mt-1 text-xs text-violet-700">
              Queue length: {waitlistState.queueLength}
            </p>
            <button
              type="button"
              onClick={cancelWaitlist}
              className="mt-4 rounded-xl border border-violet-300 bg-white px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100"
            >
              Cancel Request
            </button>
          </section>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-violet-600/90 to-indigo-600/90 px-6 py-10 text-white">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              {astrologer.user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={astrologer.user.avatar_url}
                  alt=""
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-white/30"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/20 text-3xl font-bold ring-4 ring-white/30">
                  {astrologer.user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="text-3xl font-bold">{astrologer.user.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/90">
                  <StarRow value={astrologer.rating ?? 0} />
                  <span>
                    ({astrologer.total_reviews} review
                    {astrologer.total_reviews === 1 ? "" : "s"})
                  </span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">
                    ₹{price.toFixed(0)} / min
                  </span>
                  {astrologer.is_busy ? (
                    <span className="rounded-full bg-orange-500/30 px-2 py-0.5 text-xs font-semibold">
                      Busy · {astrologer.waiting_count} waiting
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {astrologer.specializations.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-sm text-white/85">
                  Languages: {astrologer.languages.join(", ")}
                </p>
                {astrologer.experience_years != null ? (
                  <p className="mt-1 text-sm text-white/85">
                    {astrologer.experience_years}+ years experience
                  </p>
                ) : null}
              </div>
              <div className="hidden lg:block">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={chatLoading}
                    onClick={() => {
                      if (!astrologer.is_available && !astrologer.is_busy) {
                        setError("Astrologer is offline");
                        return;
                      }
                      void startChat();
                    }}
                    className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-violet-700 shadow-md transition hover:bg-white/95 disabled:cursor-not-allowed disabled:bg-white/50 disabled:text-violet-400"
                  >
                    {chatLoading
                      ? "Starting…"
                      : astrologer.is_busy
                        ? `Join Waitlist (${astrologer.waiting_count})`
                        : astrologer.is_available
                          ? `Chat — ₹${price.toFixed(0)}/min`
                          : "Chat"}
                  </button>

                  <button
                    type="button"
                    disabled={chatLoading}
                    onClick={() => {
                      if (!astrologer.is_available && !astrologer.is_busy) {
                        setError("Astrologer is offline");
                        return;
                      }
                      void startChat("voice");
                    }}
                    className="rounded-xl border border-white/40 bg-white/80 px-4 py-3 text-sm font-bold text-violet-700 shadow-md transition hover:bg-white/95 disabled:cursor-not-allowed disabled:bg-white/50 disabled:text-violet-400"
                  >
                    {chatLoading
                      ? "Starting…"
                      : astrologer.is_busy
                        ? `Join Waitlist (${astrologer.waiting_count})`
                        : astrologer.is_available
                          ? `Voice — ₹${price.toFixed(0)}/min`
                          : "Voice"}
                  </button>

                  <button
                    type="button"
                    disabled={chatLoading}
                    onClick={() => {
                      if (!astrologer.is_available && !astrologer.is_busy) {
                        setError("Astrologer is offline");
                        return;
                      }
                      void startChat("video");
                    }}
                    className="rounded-xl border border-white/40 bg-white/80 px-4 py-3 text-sm font-bold text-violet-700 shadow-md transition hover:bg-white/95 disabled:cursor-not-allowed disabled:bg-white/50 disabled:text-violet-400"
                  >
                    {chatLoading
                      ? "Starting…"
                      : astrologer.is_busy
                        ? `Join Waitlist (${astrologer.waiting_count})`
                        : astrologer.is_available
                          ? `Video — ₹${price.toFixed(0)}/min`
                          : "Video"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-slate-600">
            {astrologer.bio?.trim()
              ? astrologer.bio
              : "This astrologer hasn’t added a bio yet."}
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No reviews yet.</p>
          ) : (
            <ul className="mt-4 space-y-6">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-slate-100 pb-6 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {r.user_name}
                    </span>
                    <StarRow value={r.rating} />
                    <span className="text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur lg:hidden">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={chatLoading}
            onClick={() => {
              if (!astrologer.is_available && !astrologer.is_busy) {
                setError("Astrologer is offline");
                return;
              }
              void startChat();
            }}
            className="rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3.5 text-sm font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chatLoading ? "…" : "Chat"}
          </button>
          <button
            type="button"
            disabled={chatLoading}
            onClick={() => {
              if (!astrologer.is_available && !astrologer.is_busy) {
                setError("Astrologer is offline");
                return;
              }
              void startChat("voice");
            }}
            className="rounded-xl border border-purple-200 bg-white/70 py-3.5 text-sm font-bold text-violet-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chatLoading ? "…" : "Voice"}
          </button>
          <button
            type="button"
            disabled={chatLoading}
            onClick={() => {
              if (!astrologer.is_available && !astrologer.is_busy) {
                setError("Astrologer is offline");
                return;
              }
              void startChat("video");
            }}
            className="rounded-xl border border-purple-200 bg-white/70 py-3.5 text-sm font-bold text-violet-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {chatLoading ? "…" : "Video"}
          </button>
        </div>
      </div>

      {busyPromptOpen ? (
        <div className="fixed inset-0 z-[85] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Astrologer is busy</h2>
            <p className="mt-2 text-sm text-slate-700">
              This astrologer is in another active session.
              <span className="font-semibold">
                {" "}
                {busyQueueLength} users already waiting.
              </span>
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
                onClick={() => setBusyPromptOpen(false)}
              >
                Not now
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                onClick={joinWaitlist}
                disabled={joinWaitlistLoading}
              >
                {joinWaitlistLoading ? "Joining…" : "Join Waitlist"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rechargeOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">
                Wallet balance low
              </h2>
              <button
                type="button"
                className="text-slate-500 hover:text-slate-800"
                onClick={() => setRechargeOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              You need at least{" "}
              <span className="font-semibold">
                ₹{(price * 5).toFixed(0)}
              </span>{" "}
              for a minimum chat ({`5 × ₹${price.toFixed(0)}`} per minute
              rate). Recharge to continue.
            </p>
            <div className="mt-5">
              <WalletWidget />
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-slate-200 py-2 text-sm font-semibold text-slate-700"
              onClick={() => setRechargeOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {queueTurn ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Your turn!</h2>
            <p className="mt-2 text-sm text-slate-700">
              Connecting to {queueTurn.astrologerName}...
            </p>
            <p className="mt-4 text-center text-3xl font-bold text-violet-700">
              {queueTurn.countdown}
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-2.5 text-sm font-semibold text-white"
              onClick={() => {
                const astrologerName = encodeURIComponent(queueTurn.astrologerName);
                router.push(`/chat/${queueTurn.sessionId}?name=${astrologerName}`);
              }}
            >
              Connect Now
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
