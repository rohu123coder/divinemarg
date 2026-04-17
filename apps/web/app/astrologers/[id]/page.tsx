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
  is_online: boolean;
  is_busy: boolean;
  waiting_count: number;
  profile_photo_url?: string | null;
  experience_years: number | null;
  user: {
    name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
    profile_photo_url?: string | null;
  };
};

type RatingBreakdown = {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
};

type SimilarAstrologer = {
  id: string;
  name: string;
  profile_photo_url: string | null;
  avatar_url: string | null;
  specializations: string[];
  price_per_minute: number | null;
  rating: number | null;
};

function StarRow({ value }: { value: number | null }) {
  const count = Math.max(0, Math.min(5, Math.round(value ?? 0)));
  return (
    <span className="text-amber-500" aria-hidden>
      {"★".repeat(count)}
      <span className="text-slate-200">
        {"★".repeat(Math.max(0, 5 - count))}
      </span>
    </span>
  );
}

function formatK(n: number): string {
  if (n >= 1000) {
    return `${Math.round(n / 100) / 10}K`;
  }
  return String(n);
}

export default function AstrologerProfilePage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const { isLoggedIn, user, token } = useAuthStore();
  const [data, setData] = useState<{
    astrologer: AstrologerDetail;
    reviews: Review[];
    rating_breakdown: RatingBreakdown;
  } | null>(null);
  const [similarAstrologers, setSimilarAstrologers] = useState<SimilarAstrologer[]>(
    []
  );
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
          rating_breakdown: RatingBreakdown;
        };
        if (!cancelled && d) {
          setData(d);
        }
        const similarRes = await api.get("/api/astrologers", {
          params: { page: 1, limit: 12 },
        });
        const list =
          (similarRes.data?.data?.astrologers as SimilarAstrologer[] | undefined) ?? [];
        if (!cancelled) {
          setSimilarAstrologers(
            list
              .filter((a) => a.id !== id)
              .slice(0, 6)
              .map((a) => ({
                ...a,
                profile_photo_url: a.profile_photo_url ?? null,
                avatar_url: a.avatar_url ?? null,
              }))
          );
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
  const ratingBreakdown = data.rating_breakdown;
  const ratingTotal = Math.max(
    1,
    ratingBreakdown[5] +
      ratingBreakdown[4] +
      ratingBreakdown[3] +
      ratingBreakdown[2] +
      ratingBreakdown[1]
  );
  const displayPhoto =
    astrologer.profile_photo_url ??
    astrologer.user.profile_photo_url ??
    astrologer.user.avatar_url ??
    null;
  const chatMinutes = formatK((astrologer.total_reviews || 1) * 18);
  const callMinutes = formatK((astrologer.total_reviews || 1) * 24);
  const specializationText = astrologer.specializations.join(", ");
  const languagesText = astrologer.languages.join(", ");
  const headerRating = astrologer.rating ?? 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-28 lg:pb-10">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-4 text-sm text-slate-500">
          <Link href="/" className="hover:text-[#B8960C]">
            Home
          </Link>{" "}
          &gt;{" "}
          <Link href="/astrologers" className="hover:text-[#B8960C]">
            Astrologers
          </Link>{" "}
          &gt; <span>{astrologer.user.name}&apos;s Profile</span>
        </div>

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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row">
            <div className="shrink-0">
              {displayPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayPhoto}
                  alt=""
                  className="h-[200px] w-[200px] rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-[200px] w-[200px] items-center justify-center rounded-2xl bg-slate-100 text-4xl font-bold text-slate-700">
                  {astrologer.user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900">{astrologer.user.name}</h1>
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
                  ✓
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{specializationText || "Astrologer"}</p>
              <p className="mt-1 text-sm text-slate-600">{languagesText}</p>
              <p className="mt-1 text-sm text-slate-600">
                Exp: {astrologer.experience_years ?? 0} Years
              </p>
              <p className="mt-2 text-lg font-bold text-slate-900">₹{price.toFixed(0)}/min</p>
              <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
                <StarRow value={headerRating} />
                <span>{headerRating.toFixed(2)}</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-700">
                <span>💬 {chatMinutes} mins</span>
                <span>📞 {callMinutes} mins</span>
                {astrologer.is_busy ? (
                  <span className="font-semibold text-red-600">
                    Busy · {astrologer.waiting_count} in queue
                  </span>
                ) : null}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
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
                  className="rounded-full bg-[#16A34A] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Start Chat
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
                  className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Start Call
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
                  className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
                >
                  Start Video
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">About me</h2>
          <p className="mt-3 whitespace-pre-wrap text-slate-600">
            {astrologer.bio?.trim()
              ? astrologer.bio
              : "This astrologer hasn’t added a bio yet."}
          </p>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Rating & Reviews</h2>
          <div className="mt-5 grid gap-6 lg:grid-cols-[340px,1fr]">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-4xl font-bold text-slate-900">
                {(astrologer.rating ?? 0).toFixed(2)}
              </p>
              <p className="mt-2">
                <StarRow value={astrologer.rating} />
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {astrologer.total_reviews} total reviews
              </p>

              <div className="mt-5 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown[star as 5 | 4 | 3 | 2 | 1] ?? 0;
                  const width = (count / ratingTotal) * 100;
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="w-4">{star}★</span>
                      <div className="h-2.5 flex-1 rounded-full bg-slate-100">
                        <div
                          className="h-2.5 rounded-full bg-amber-400"
                          style={{ width: `${Math.max(3, width)}%` }}
                        />
                      </div>
                      <span className="w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              {reviews.length === 0 ? (
                <p className="text-sm text-slate-600">No reviews yet.</p>
              ) : (
                <ul className="space-y-4">
                  {reviews.slice(0, 8).map((r) => (
                    <li key={r.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
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
                      <p className="mt-2 text-sm text-slate-600">
                        {r.comment || "Great consultation and accurate guidance."}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Similar Astrologers</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {similarAstrologers.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => router.push(`/astrologers/${a.id}`)}
                className="min-w-[220px] rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {a.profile_photo_url || a.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.profile_photo_url ?? a.avatar_url ?? ""}
                      alt={a.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                      {a.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{a.name}</p>
                    <p className="truncate text-xs text-slate-600">
                      {a.specializations.join(", ")}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-amber-500">
                  {"★".repeat(Math.max(1, Math.round(a.rating ?? 4)))}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  ₹{(a.price_per_minute ?? 0).toFixed(0)}/min
                </p>
              </button>
            ))}
          </div>
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
