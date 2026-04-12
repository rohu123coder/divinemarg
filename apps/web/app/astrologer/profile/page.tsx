"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AstrologerNavbar } from "@/components/AstrologerNavbar";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/store";

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

type ProfileDetail = {
  id: string;
  bio: string | null;
  specializations: string[];
  languages: string[];
  price_per_minute: number | null;
  experience_years: number | null;
};

export default function AstrologerProfilePage() {
  const router = useRouter();
  const { user, token, isLoggedIn } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [specs, setSpecs] = useState<Set<string>>(new Set());
  const [langs, setLangs] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState<number>(5);
  const [experienceYears, setExperienceYears] = useState<number>(0);

  const load = useCallback(async (astroId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/astrologers/${astroId}`);
      const a = res.data?.data?.astrologer as ProfileDetail | undefined;
      if (!a) {
        throw new Error("missing");
      }
      setBio(a.bio ?? "");
      setSpecs(new Set(a.specializations ?? []));
      setLangs(new Set(a.languages ?? []));
      setPrice(Math.max(5, a.price_per_minute ?? 5));
      setExperienceYears(a.experience_years ?? 0);
    } finally {
      setLoading(false);
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
    if (user?.role !== "astrologer" || !user.astrologerId) {
      router.replace("/dashboard");
      return;
    }
    void load(user.astrologerId);
  }, [mounted, isLoggedIn, token, user?.role, user?.astrologerId, router, load]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const toggle = (set: Set<string>, key: string, next: boolean) => {
    const n = new Set(set);
    if (next) {
      n.add(key);
    } else {
      n.delete(key);
    }
    return n;
  };

  const save = async () => {
    if (price < 5) {
      setToast("Price per minute must be at least ₹5");
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/astrologers/profile`, {
        bio: bio.trim() || null,
        specializations: Array.from(specs),
        languages: Array.from(langs),
        price_per_minute: price,
        experience_years: experienceYears,
      });
      setToast("Profile saved successfully.");
    } catch {
      setToast("Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !isLoggedIn || user?.role !== "astrologer") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <AstrologerNavbar />

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[90] w-[min(90vw,24rem)] -translate-x-1/2 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-900 shadow-lg ring-1 ring-emerald-200">
          {toast}
        </div>
      ) : null}

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Your profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          This information is shown to users browsing astrologers.
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        ) : (
          <form
            className="mt-8 space-y-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
          >
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={5}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-violet-500 focus:ring-2"
                placeholder="Tell clients about your approach…"
              />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">
                Specializations
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {SPEC_OPTIONS.map((s) => (
                  <label
                    key={s}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={specs.has(s)}
                      onChange={(e) =>
                        setSpecs(toggle(specs, s, e.target.checked))
                      }
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-800">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">Languages</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {LANG_OPTIONS.map((s) => (
                  <label
                    key={s}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={langs.has(s)}
                      onChange={(e) =>
                        setLangs(toggle(langs, s, e.target.checked))
                      }
                      className="rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-800">{s}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Price per minute (₹)
                </label>
                <input
                  type="number"
                  min={5}
                  step={1}
                  value={price}
                  onChange={(e) =>
                    setPrice(Number(e.target.value) || 0)
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-violet-500 focus:ring-2"
                />
                <p className="mt-1 text-xs text-slate-500">Minimum ₹5</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Experience (years)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={experienceYears}
                  onChange={(e) =>
                    setExperienceYears(
                      Math.max(0, parseInt(e.target.value, 10) || 0)
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-violet-500 focus:ring-2"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-3 text-sm font-semibold text-white shadow-md disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save profile"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
