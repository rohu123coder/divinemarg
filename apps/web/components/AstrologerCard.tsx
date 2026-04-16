"use client";

import Link from "next/link";
import { useMemo } from "react";

const pillColors = [
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
  "bg-emerald-100 text-emerald-800",
];

export type AstrologerCardProps = {
  id: string;
  name: string;
  avatar_url: string | null;
  profile_photo_url?: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  price_per_minute: number | null;
  is_available: boolean;
  is_online?: boolean;
  chat_available?: boolean;
  voice_available?: boolean;
  video_available?: boolean;
  is_verified?: boolean;
  is_busy?: boolean;
  waiting_count?: number;
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
  price_per_minute,
  is_online = false,
  chat_available = true,
  voice_available = false,
  video_available = false,
  is_busy = false,
  waiting_count = 0,
  experience_years,
  onChatNow,
  onVoiceCall,
  onVideoCall,
  actionLoading = false,
}: AstrologerCardProps) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "?";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [name]);

  const displayPhoto = profile_photo_url ?? avatar_url;

  const price = price_per_minute ?? 0;

  const chatUi =
    onChatNow != null ? (
      <button
        type="button"
        disabled={actionLoading}
        onClick={onChatNow}
        className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-orange-500 px-3 py-2 text-center text-sm font-semibold text-white shadow-md transition group-hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {actionLoading ? "Starting..." : is_busy ? "Join Waitlist" : "Chat Now"}
      </button>
    ) : (
      <Link
        href={`/astrologers/${id}`}
        className="block flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 py-2.5 text-center text-sm font-semibold text-white shadow-md transition group-hover:opacity-95"
      >
        {is_busy ? "Join Waitlist" : "Chat Now"}
      </Link>
    );

  return (
    <div className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex gap-4">
        {displayPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayPhoto}
            alt=""
            className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-violet-100"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-orange-400 text-lg font-bold text-white ring-2 ring-violet-100">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900">{name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-100">
              ⭐ {rating != null ? rating.toFixed(1) : "New"}
            </span>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                is_busy
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  : is_online
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                  : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              {is_busy ? "Busy" : is_online ? "Online" : "Offline"}
            </span>
            {is_busy ? (
              <span className="inline-flex rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
                Busy · {waiting_count} waiting
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {specializations.slice(0, 4).map((s, i) => (
          <span
            key={`${s}-${i}`}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              pillColors[i % pillColors.length]
            }`}
          >
            {s}
          </span>
        ))}
      </div>

      <p className="mt-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-800">
          ₹{price.toFixed(0)}
        </span>
        <span className="text-slate-500"> / min</span>
        {experience_years != null ? (
          <span className="ml-2 text-slate-500">
            · {experience_years}+ yrs exp.
          </span>
        ) : null}
      </p>

      <div className="mt-auto pt-4">
        {is_busy ? (
          <div className="flex flex-wrap items-center gap-2">{chatUi}</div>
        ) : !is_online ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-slate-200 py-2.5 text-center text-sm font-semibold text-slate-500"
          >
            Offline
          </button>
        ) : !chat_available && !voice_available && !video_available ? (
          <button
            type="button"
            disabled
            className="w-full cursor-not-allowed rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-center text-sm font-semibold text-amber-900"
          >
            Online but unavailable
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {chat_available ? chatUi : null}
            {voice_available ? (
              <button
                type="button"
                onClick={onVoiceCall}
                disabled={actionLoading}
                className="rounded-lg border border-green-500 px-3 py-2 text-sm font-semibold text-green-600 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                📞 Voice
              </button>
            ) : null}
            {video_available ? (
              <button
                type="button"
                onClick={onVideoCall}
                disabled={actionLoading}
                className="rounded-lg border border-blue-500 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                📹 Video
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
