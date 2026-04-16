"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  profile_photo_url: string | null;
};

export default function AstrologerProfilePage() {
  const router = useRouter();
  const { user, token, isLoggedIn, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [specs, setSpecs] = useState<Set<string>>(new Set());
  const [langs, setLangs] = useState<Set<string>>(new Set());
  const [price, setPrice] = useState<number>(5);
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photoInitials = useMemo(() => {
    const parts = (user?.name ?? "").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "?";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [user?.name]);

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
      setProfilePhotoUrl(a.profile_photo_url ?? null);
      setPreviewUrl(null);
      setPendingFile(null);
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

  const onPhotoChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setPhotoMessage("Image must be 2MB or smaller.");
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/i.test(f.type)) {
      setPhotoMessage("Use JPG, PNG, or WebP.");
      return;
    }
    setPhotoMessage(null);
    setPendingFile(f);
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(f);
    });
  };

  const savePhoto = async () => {
    if (!pendingFile || !token || !user) {
      return;
    }
    setPhotoUploading(true);
    setPhotoMessage(null);
    try {
      const fd = new FormData();
      fd.append("photo", pendingFile);
      const res = await api.post(`/api/astrologers/photo`, fd);
      const url = res.data?.data?.photo_url as string | undefined;
      if (url) {
        setProfilePhotoUrl(url);
        setPendingFile(null);
        setPreviewUrl((prev) => {
          if (prev?.startsWith("blob:")) {
            URL.revokeObjectURL(prev);
          }
          return null;
        });
        setPhotoMessage("Photo saved.");
        setUser({ ...user, profile_photo_url: url }, token);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch {
      setPhotoMessage("Could not upload photo.");
    } finally {
      setPhotoUploading(false);
    }
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
          <>
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Profile photo
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                JPG, PNG, or WebP. Maximum size 2MB.
              </p>
              <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {previewUrl || profilePhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl ?? profilePhotoUrl ?? ""}
                    alt=""
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-violet-100"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-400 text-2xl font-bold text-white ring-2 ring-violet-100">
                    {photoInitials}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/*"
                    className="hidden"
                    onChange={onPhotoChosen}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    Change Photo
                  </button>
                  {pendingFile ? (
                    <button
                      type="button"
                      disabled={photoUploading}
                      onClick={() => void savePhoto()}
                      className="rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                    >
                      {photoUploading ? "Uploading…" : "Save Photo"}
                    </button>
                  ) : null}
                  {photoMessage ? (
                    <p className="text-sm text-slate-600">{photoMessage}</p>
                  ) : null}
                </div>
              </div>
            </section>

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
          </>
        )}
      </main>
    </div>
  );
}
