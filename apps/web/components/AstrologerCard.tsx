"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

export type AstrologerCardProps = {
  id: string;
  name: string;
  avatar_url: string | null;
  profile_photo_url?: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  total_reviews?: number;
  price_per_minute: number | null;
  is_available: boolean;
  is_online?: boolean;
  chat_available?: boolean;
  voice_available?: boolean;
  video_available?: boolean;
  is_verified?: boolean;
  is_busy?: boolean;
  waiting_count?: number;
  estimated_wait?: number | null;
  avg_session_duration?: number | null;
  experience_years: number | null;
  onChatNow?: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  actionLoading?: boolean;
};

export function AstrologerCard({
  id,
  name,
  avatar_url,
  profile_photo_url,
  specializations,
  rating,
  total_reviews = 0,
  price_per_minute,
  is_online = false,
  voice_available = false,
  video_available = false,
  is_busy = false,
  waiting_count = 0,
  estimated_wait = null,
  experience_years,
  onChatNow,
  onVoiceCall,
  onVideoCall,
  actionLoading = false,
}: AstrologerCardProps) {
  const router = useRouter();
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "?";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [name]);

  const displayPhoto = profile_photo_url ?? avatar_url;

  const price = price_per_minute ?? 0;
  const stars = "★".repeat(Math.max(1, Math.round(rating ?? 4)));
  const waitText = is_busy
    ? `Wait ~${Math.max(1, estimated_wait ?? waiting_count * 5)}m`
    : null;
  const orders = Math.max(0, total_reviews ?? 0);

  return (
    <article
      className="group relative flex h-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
      onClick={() => router.push(`/astrologers/${id}`)}
    >
      {is_verified ? (
        <span className="absolute right-3 top-3 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">
          ✓
        </span>
      ) : null}

      <div className="flex w-full gap-4">
        {displayPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayPhoto}
            alt=""
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="pr-8 text-[16px] font-bold text-slate-900">{name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">
            {specializations.join(", ")}
          </p>
          <p className="mt-1 text-[13px] text-slate-500">
            {languages.join(", ")}
          </p>
          <p className="mt-1 text-[13px] text-slate-600">
            Exp: {experience_years ?? 0} Years
          </p>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-amber-500">{stars}</p>
              <p className="text-xs text-slate-500">
                {orders > 0 ? `${orders} orders` : "New astrologer"}
              </p>
            </div>
            <p className="text-sm font-bold text-slate-900">₹{price.toFixed(0)}/min</p>
          </div>

          <div className="mt-3 flex items-center gap-2">
            {!is_online ? (
              <button
                type="button"
                disabled
                onClick={(e) => e.stopPropagation()}
                className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-400"
              >
                Chat
              </button>
            ) : is_busy ? (
              <button
                type="button"
                disabled={actionLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onChatNow?.();
                }}
                className="rounded-full border border-red-500 px-4 py-1.5 text-sm font-semibold text-red-600"
              >
                Chat
              </button>
            ) : (
              <button
                type="button"
                disabled={actionLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onChatNow?.();
                }}
                className="rounded-full border border-emerald-500 px-4 py-1.5 text-sm font-semibold text-emerald-600"
              >
                Chat
              </button>
            )}

            {voice_available ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVoiceCall?.();
                }}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-sm"
                aria-label="Voice call"
              >
                📞
              </button>
            ) : null}
            {video_available ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVideoCall?.();
                }}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-sm"
                aria-label="Video call"
              >
                📹
              </button>
            ) : null}
          </div>

          {waitText ? (
            <p className="mt-1 text-xs font-semibold text-red-500">{waitText}</p>
          ) : !is_online ? (
            <p className="mt-1 text-xs text-slate-400">Offline</p>
          ) : (
            <p className="mt-1 text-xs text-emerald-600">Available now</p>
          )}
        </div>
      </div>
    </article>
  );
}
