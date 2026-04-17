"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

import { AstrologerCard } from "@/components/AstrologerCard";
import { Navbar } from "@/components/Navbar";
import api from "@/lib/api";
import { getSocketApiBase } from "@/lib/socketBase";
import { useAuthStore } from "@/lib/store";

type Astro = {
  id: string;
  name: string;
  avatar_url: string | null;
  profile_photo_url: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  total_reviews: number;
  price_per_minute: number | null;
  is_available: boolean;
  is_online: boolean;
  is_verified?: boolean;
  chat_available: boolean;
  voice_available: boolean;
  video_available: boolean;
  is_busy: boolean;
  waiting_count: number;
  avg_session_duration: number | null;
  estimated_wait: number;
  experience_years: number | null;
};

type ApiSort = "rating_desc" | "price_asc" | "price_desc";

const SPEC_OPTIONS = [
  "Love & Relationship",
  "Career",
  "Finance",
  "Vastu",
  "Numerology",
  "Tarot",
  "Palmistry",
] as const;

const LANG_OPTIONS = [
  "Hindi",
  "English",
  "Tamil",
  "Telugu",
  "Bengali",
] as const;

const SORT_OPTIONS: { label: string; value: ApiSort }[] = [
  { label: "Top Rated", value: "rating_desc" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

const PAGE_SIZE = 9;
const CATEGORY_PILLS = [
  "All",
  "Love",
  "Career",
  "Finance",
  "Marriage",
  "Health",
  "Vastu",
  "Numerology",
  "Tarot",
] as const;

function matchesCategory(a: Astro, category: string): boolean {
  if (category === "All") {
    return true;
  }
  const lowered = category.toLowerCase();
  return a.specializations.some((spec) => {
    const s = spec.toLowerCase();
    if (lowered === "love" || lowered === "marriage") {
      return s.includes("love") || s.includes("relationship") || s.includes("marriage");
    }
    return s.includes(lowered);
  });
}

function matchesFilters(
  a: Astro,
  specs: string[],
  langs: string[]
): boolean {
  if (
    specs.length > 0 &&
    !specs.some((s) => a.specializations.includes(s))
  ) {
    return false;
  }
  if (langs.length > 0 && !langs.some((l) => a.languages.includes(l))) {
    return false;
  }
  return true;
}

async function fetchAstrologersPage(page: number, sort: ApiSort) {
  const res = await api.get(`/api/astrologers`, {
    params: { page, limit: 50, sort },
  });
  return res.data.data as {
    astrologers: Astro[];
    page: number;
    limit: number;
    total: number;
  };
}

async function fetchAllAstrologers(sort: ApiSort): Promise<Astro[]> {
  const first = await fetchAstrologersPage(1, sort);
  const all = [...first.astrologers];
  const totalPages = Math.ceil(first.total / first.limit);
  let p = 2;
  while (p <= totalPages && p <= 30) {
    const next = await fetchAstrologersPage(p, sort);
    all.push(...next.astrologers);
    p++;
  }
  return all;
}

function FilterSidebar(props: {
  specs: Set<string>;
  langs: Set<string>;
  sort: ApiSort;
  toggleSpec: (s: string) => void;
  toggleLang: (s: string) => void;
  setSort: (s: ApiSort) => void;
  className?: string;
}) {
  const {
    specs,
    langs,
    sort,
    toggleSpec,
    toggleLang,
    setSort,
    className = "",
  } = props;
  return (
    <aside className={`space-y-6 ${className}`}>
      <div>
        <h3 className="text-sm font-bold text-slate-900">Specialization</h3>
        <div className="mt-3 space-y-2">
          {SPEC_OPTIONS.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={specs.has(s)}
                onChange={() => toggleSpec(s)}
                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm text-slate-700">{s}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900">Language</h3>
        <div className="mt-3 space-y-2">
          {LANG_OPTIONS.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={langs.has(s)}
                onChange={() => toggleLang(s)}
                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-sm text-slate-700">{s}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-bold text-slate-900" htmlFor="sort">
          Sort
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as ApiSort)}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-violet-500 focus:ring-2"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-200/80" />
      ))}
    </div>
  );
}

export default function AstrologersPage() {
  const router = useRouter();
  const { isLoggedIn, user, token } = useAuthStore();
  const [sort, setSort] = useState<ApiSort>("rating_desc");
  const [specs, setSpecs] = useState<Set<string>>(new Set());
  const [langs, setLangs] = useState<Set<string>>(new Set());
  const [all, setAll] = useState<Astro[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<(typeof CATEGORY_PILLS)[number]>("All");
  const [pendingAction, setPendingAction] = useState<{
    astrologer: Astro;
    callType: "voice" | "video";
    required: number;
  } | null>(null);
  const [actionLoadingKey, setActionLoadingKey] = useState<string | null>(null);

  const toggleSpec = useCallback((s: string) => {
    setSpecs((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
    setPage(1);
  }, []);

  const toggleLang = useCallback((s: string) => {
    setLangs((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
    setPage(1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const rows = await fetchAllAstrologers(sort);
        if (!cancelled) {
          setAll(
            rows.map((a) => ({
              ...a,
              profile_photo_url: a.profile_photo_url ?? null,
              chat_available: a.chat_available ?? true,
              voice_available: a.voice_available ?? false,
              video_available: a.video_available ?? false,
            }))
          );
        }
      } catch {
        if (!cancelled) {
          setAll([]);
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
  }, [sort]);

  useEffect(() => {
    if (!token || !isLoggedIn) {
      return;
    }
    const socket: Socket = io(getSocketApiBase(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socket.on(
      "astrologer_status_changed",
      (payload: { astrologerId: string; is_online: boolean }) => {
        setAll((prev) =>
          prev.map((astro) =>
            astro.id === payload.astrologerId
              ? { ...astro, is_online: payload.is_online }
              : astro
          )
        );
      }
    );
    return () => {
      socket.disconnect();
    };
  }, [isLoggedIn, token]);

  const filtered = useMemo(() => {
    const s = Array.from(specs);
    const l = Array.from(langs);
    const term = search.trim().toLowerCase();
    return all
      .filter((a) => matchesFilters(a, s, l))
      .filter((a) => matchesCategory(a, activeCategory))
      .filter((a) => (term ? a.name.toLowerCase().includes(term) : true));
  }, [activeCategory, all, search, specs, langs]);

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const slice = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const startSession = useCallback(
    async (astrologer: Astro, callType: "chat" | "voice" | "video") => {
      const actionKey = `${astrologer.id}:${callType}`;
      setActionLoadingKey(actionKey);
      setError(null);
      try {
        let res;
        try {
          res = await api.post(`/api/sessions/request`, {
            astrologerId: astrologer.id,
            sessionType: callType === "chat" ? undefined : callType,
          });
        } catch (e: unknown) {
          const status =
            e &&
            typeof e === "object" &&
            "response" in e &&
            e.response &&
            typeof e.response === "object" &&
            "status" in e.response
              ? Number(e.response.status)
              : null;
          if (status !== 404) {
            throw e;
          }
          res = await api.post(`/api/chat/request`, {
            astrologer_id: astrologer.id,
          });
        }

        const sessionId = (res.data?.data?.session_id ??
          res.data?.data?.sessionId) as string | undefined;
        if (!sessionId) {
          throw new Error("No session returned");
        }

        const name = encodeURIComponent(astrologer.name);
        const autoCallQuery =
          callType === "voice" || callType === "video"
            ? `&autoCall=${callType}`
            : "";
        router.push(`/chat/${sessionId}?name=${name}${autoCallQuery}`);
      } catch {
        setError("Could not start session. Please try again.");
      } finally {
        setActionLoadingKey(null);
      }
    },
    [router]
  );

  const handleCardAction = useCallback(
    (astrologer: Astro, callType: "chat" | "voice" | "video") => {
      if (!isLoggedIn) {
        router.push(`/login?redirect=${encodeURIComponent("/astrologers")}`);
        return;
      }

      if (callType === "voice" || callType === "video") {
        const rate = Number(astrologer.price_per_minute ?? 0);
        const required = Math.max(0, rate * 3);
        const balance = Number(user?.wallet_balance ?? 0);
        if (balance < required) {
          setPendingAction({ astrologer, callType, required });
          return;
        }
      }

      void startSession(astrologer, callType);
    },
    [isLoggedIn, router, startSession, user?.wallet_balance]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:flex lg:gap-8 lg:py-10">
        <FilterSidebar
          specs={specs}
          langs={langs}
          sort={sort}
          toggleSpec={toggleSpec}
          toggleLang={toggleLang}
          setSort={(s) => {
            setSort(s);
            setPage(1);
          }}
          className="hidden w-64 shrink-0 lg:block"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm lg:hidden"
              onClick={() => setSheetOpen(true)}
            >
              Filters
            </button>
          </div>
          <h1 className="text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            Chat with Astrologer
          </h1>
          <div className="mt-4 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2">
              {CATEGORY_PILLS.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    activeCategory === category
                      ? "border-[#B8960C] bg-[#B8960C] text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-[#B8960C] hover:text-[#B8960C]"
                  }`}
                  onClick={() => {
                    setActiveCategory(category);
                    setPage(1);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-[#B8960C] focus:ring-2"
            />
          </div>
          <p className="mt-3 text-sm text-slate-600">
            {loading
              ? "Loading…"
              : `${totalFiltered} astrologer${totalFiltered === 1 ? "" : "s"} found`}
          </p>
          {error ? (
            <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
          ) : null}

          <div className="mt-8">
            {loading ? (
              <SkeletonGrid />
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {slice.map((a) => (
                  <AstrologerCard
                    key={a.id}
                    {...a}
                    languages={a.languages}
                    total_reviews={a.total_reviews}
                    is_online={a.is_online}
                    is_verified={a.is_verified ?? false}
                    estimated_wait={a.estimated_wait}
                    actionLoading={actionLoadingKey?.startsWith(a.id) ?? false}
                    onChatNow={() => handleCardAction(a, "chat")}
                    onVoiceCall={() => handleCardAction(a, "voice")}
                    onVideoCall={() => handleCardAction(a, "video")}
                  />
                ))}
              </div>
            )}
          </div>

          {!loading && totalFiltered === 0 ? (
            <p className="mt-10 text-center text-slate-600">
              No astrologers match these filters. Try adjusting your selection.
            </p>
          ) : null}

          {!loading && totalFiltered > 0 ? (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Filters</h2>
              <button
                type="button"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => setSheetOpen(false)}
              >
                ✕
              </button>
            </div>
            <FilterSidebar
              specs={specs}
              langs={langs}
              sort={sort}
              toggleSpec={toggleSpec}
              toggleLang={toggleLang}
              setSort={(s) => {
                setSort(s);
                setPage(1);
              }}
            />
            <button
              type="button"
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3 text-sm font-semibold text-white"
              onClick={() => setSheetOpen(false)}
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}

      {pendingAction ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Wallet balance low</h2>
            <p className="mt-2 text-sm text-slate-600">
              Minimum ₹{pendingAction.required.toFixed(0)} required to start a{" "}
              {pendingAction.callType} call. Recharge now?
            </p>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
                onClick={() => setPendingAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-2.5 text-sm font-semibold text-white"
                onClick={() => {
                  setPendingAction(null);
                  router.push("/dashboard");
                }}
              >
                Recharge
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
