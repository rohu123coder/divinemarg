"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KundliCalculateResponse } from "../types";

/** Form shape (checkbox controls birth time; field name per product spec) */
export interface KundliFormFields {
  name: string;
  dob: string;
  tob: string | null;
  /** When true, birth time is unknown — submission uses 12:00 (server-side) via `tob: null` */
  dobUnknown: boolean;
  pob: string;
  lat: number | null;
  lng: number | null;
  gender: "male" | "female";
}

type GeocodeHit = {
  city: string;
  country: string;
  lat?: number;
  lng?: number;
  formattedAddress: string;
};

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function KundliForm({
  onSuccess,
}: {
  onSuccess: (data: KundliCalculateResponse) => void;
}) {
  const [form, setForm] = useState<KundliFormFields>({
    name: "",
    dob: "",
    tob: "12:00",
    dobUnknown: false,
    pob: "",
    lat: null,
    lng: null,
    gender: "male",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 8000);
    return () => clearTimeout(t);
  }, [error]);
  const [geoLoading, setGeoLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodeHit[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pobRef = useRef<HTMLDivElement>(null);

  const maxDob = useMemo(() => todayISO(), []);

  const canSubmit =
    form.name.trim().length > 0 &&
    form.dob.length > 0 &&
    form.pob.trim().length > 0 &&
    form.lat != null &&
    form.lng != null &&
    (!form.dobUnknown ? (form.tob?.length ?? 0) >= 4 : true);

  const onPobChange = useCallback((value: string) => {
    setForm((f) => ({
      ...f,
      pob: value,
      lat: null,
      lng: null,
    }));
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setGeoLoading(true);
      try {
        const res = await fetch(
          `/api/kundli/geocode?q=${encodeURIComponent(value.trim())}`
        );
        const json = (await res.json()) as {
          results?: GeocodeHit[];
          error?: string;
        };
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const list = (json.results ?? [])
          .filter(
            (r) =>
              typeof r.lat === "number" &&
              typeof r.lng === "number" &&
              !Number.isNaN(r.lat) &&
              !Number.isNaN(r.lng)
          )
          .slice(0, 5);
        setSuggestions(list);
        setShowSuggest(list.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setGeoLoading(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (pobRef.current && !pobRef.current.contains(e.target as Node)) {
        setShowSuggest(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || loading) return;
    setError(null);
    setLoading(true);
    try {
      const body = {
        name: form.name.trim(),
        dob: form.dob,
        tob: form.dobUnknown ? null : form.tob,
        pob: form.pob.trim(),
        lat: form.lat!,
        lng: form.lng!,
        gender: form.gender,
      };
      const res = await fetch("/api/kundli/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          typeof json.error === "string" ? json.error : "Calculation failed"
        );
        return;
      }
      onSuccess(json as KundliCalculateResponse);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-violet-200/60 bg-white shadow-xl shadow-violet-200/30">
          <div className="bg-gradient-to-r from-[#4C1D95] via-[#6D28D9] to-[#7C3AED] px-6 py-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              🔮 Free Kundli Generator
            </h1>
            <p className="mt-2 text-sm text-violet-100 sm:text-base">
              निःशुल्क कुंडली — Swiss Ephemeris precision · Vedic D1 chart
            </p>
            <p className="mt-1 text-xs text-violet-200/90">
              Birth details → instant planets, houses, Dasha &amp; Yogas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-5 py-7 sm:px-8">
            <div>
              <label
                htmlFor="km-name"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="km-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-violet-400/30 transition focus:border-violet-400 focus:ring-2"
              />
            </div>

            <div>
              <label
                htmlFor="km-dob"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Date of birth <span className="text-red-500">*</span>
              </label>
              <input
                id="km-dob"
                type="date"
                required
                max={maxDob}
                value={form.dob}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dob: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-violet-400/30 transition focus:border-violet-400 focus:ring-2"
              />
            </div>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Time of birth
              </span>
              <input
                id="km-tob"
                type="time"
                disabled={form.dobUnknown}
                value={form.tob ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tob: e.target.value || null }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none ring-violet-400/30 transition focus:border-violet-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              />
              <label className="mt-3 flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={form.dobUnknown}
                  onChange={(e) => {
                    const c = e.target.checked;
                    setForm((f) => ({
                      ...f,
                      dobUnknown: c,
                      tob: c ? null : "12:00",
                    }));
                  }}
                  className="mt-1 h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                />
                <span className="text-sm text-slate-600">
                  I don&apos;t know my exact birth time (will use 12:00 noon)
                </span>
              </label>
              <p className="mt-2 text-xs text-slate-500">
                Accurate time gives precise Ascendant &amp; house positions
              </p>
            </div>

            <div ref={pobRef} className="relative">
              <label
                htmlFor="km-pob"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Place of birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  id="km-pob"
                  type="text"
                  autoComplete="off"
                  placeholder="Search city or town"
                  value={form.pob}
                  onChange={(e) => onPobChange(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 shadow-sm outline-none ring-violet-400/30 transition focus:border-violet-400 focus:ring-2"
                />
                {geoLoading ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-500">
                    <Spinner className="h-5 w-5" />
                  </div>
                ) : null}
              </div>
              {showSuggest && suggestions.length > 0 ? (
                <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-violet-100 bg-white py-1 shadow-lg">
                  {suggestions.map((s, i) => {
                    const line = [s.city, s.country].filter(Boolean).join(", ");
                    return (
                      <li key={`${s.formattedAddress}-${i}`}>
                        <button
                          type="button"
                          className="w-full px-4 py-2.5 text-left text-sm text-slate-800 hover:bg-violet-50"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              pob: s.formattedAddress || line,
                              lat: s.lat!,
                              lng: s.lng!,
                            }));
                            setShowSuggest(false);
                            setSuggestions([]);
                          }}
                        >
                          {line || s.formattedAddress}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Gender
              </span>
              <div className="flex flex-wrap gap-3">
                {(
                  [
                    { v: "male" as const, label: "♂ Male" },
                    { v: "female" as const, label: "♀ Female" },
                  ] as const
                ).map(({ v, label }) => (
                  <label
                    key={v}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
                      form.gender === v
                        ? "border-violet-600 bg-violet-50 text-violet-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-violet-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={v}
                      checked={form.gender === v}
                      onChange={() => setForm((f) => ({ ...f, gender: v }))}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-4 text-base font-semibold text-white shadow-md shadow-violet-400/25 transition hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Spinner className="h-5 w-5 text-white" />
                  Calculating planetary positions...
                </>
              ) : (
                "Generate My Kundli ✨"
              )}
            </button>
          </form>
        </div>
      </div>

      {error ? (
        <div
          className="fixed bottom-6 left-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 text-center text-sm text-red-800 shadow-lg"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
