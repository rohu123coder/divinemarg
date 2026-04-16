"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AgoraAudioTrack,
  AgoraClient,
  AgoraRTCType,
  AgoraVideoTrack,
} from "./AgoraCallScreenTypes";

type CallType = "voice" | "video";
type CallPhase = "incoming" | "calling" | "active";

type AgoraCallScreenProps = {
  channelName: string;
  token: string;
  uid: number;
  appId: string;
  callType: CallType;
  astrologerName: string;
  elapsedSeconds?: number;
  pricePerMinute?: number;
  phase: CallPhase;
  callerName?: string;
  autoDeclineSeconds?: number;
  onEndCall: () => void;
  onAcceptCall?: () => void;
  onDeclineCall?: () => void;
};

function initials(name: string): string {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function AgoraCallScreen({
  channelName,
  token,
  uid,
  appId,
  callType,
  astrologerName,
  elapsedSeconds,
  pricePerMinute,
  phase,
  callerName,
  autoDeclineSeconds = 30,
  onEndCall,
  onAcceptCall,
  onDeclineCall,
}: AgoraCallScreenProps) {
  const [countdown, setCountdown] = useState(autoDeclineSeconds);
  const [error, setError] = useState<string | null>(null);

  const remoteContainerRef = useRef<HTMLDivElement | null>(null);
  const localContainerRef = useRef<HTMLDivElement | null>(null);

  const clientRef = useRef<AgoraClient | null>(null);
  const micTrackRef = useRef<AgoraAudioTrack | null>(null);
  const camTrackRef = useRef<AgoraVideoTrack | null>(null);
  const remoteAudioTrackRef = useRef<AgoraAudioTrack | null>(null);

  const [muted, setMuted] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const speakerEnabledRef = useRef(speakerEnabled);

  const chargedSoFar = useMemo(() => {
    if (!pricePerMinute) return 0;
    const seconds = typeof elapsedSeconds === "number" ? elapsedSeconds : 0;
    const minutes = Math.max(0, Math.ceil(seconds / 60));
    const raw = minutes * pricePerMinute;
    return Math.round(raw * 100) / 100;
  }, [elapsedSeconds, pricePerMinute]);

  useEffect(() => {
    if (phase !== "incoming") {
      return;
    }
    setCountdown(autoDeclineSeconds);
    const t = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [phase, autoDeclineSeconds]);

  useEffect(() => {
    speakerEnabledRef.current = speakerEnabled;
  }, [speakerEnabled]);

  useEffect(() => {
    if (phase === "incoming") {
      return;
    }
    if (!channelName || !token || !appId || !uid) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setError(null);

        // Permission prompt early so user knows what to do.
        try {
          await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: callType === "video",
          });
        } catch {
          setError("Please allow microphone/camera access to start the call.");
          return;
        }

        const AgoraRTC = (await import("agora-rtc-sdk-ng"))
          .default as unknown as AgoraRTCType;
        if (cancelled) return;

        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        client.on("user-published", async (user: unknown, mediaType: unknown) => {
          try {
            await client.subscribe(user, mediaType);
          } catch {
            // ignore subscribe errors (e.g. quick disconnect)
          }

          const u = user as {
            audioTrack?: AgoraAudioTrack;
            videoTrack?: AgoraVideoTrack;
          };

          if (mediaType === "audio" && u.audioTrack) {
            remoteAudioTrackRef.current = u.audioTrack;
            u.audioTrack.play?.();
            u.audioTrack.setVolume?.(
              speakerEnabledRef.current ? 100 : 0
            );
          }

          if (mediaType === "video" && u.videoTrack) {
            if (remoteContainerRef.current) {
              u.videoTrack.play?.(remoteContainerRef.current);
            }
          }
        });

        client.on("user-unpublished", (_user: unknown, mediaType: unknown) => {
          if (mediaType === "audio") {
            remoteAudioTrackRef.current = null;
          }
        });

        await client.join(appId, channelName, token, uid);

        if (callType === "voice") {
          const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
          micTrackRef.current = micTrack;
          await client.publish([micTrack]);
        } else {
          const [micTrack, camTrack] =
            await AgoraRTC.createMicrophoneAndCameraTracks();
          micTrackRef.current = micTrack;
          camTrackRef.current = camTrack;
          if (localContainerRef.current) {
            camTrack.play?.(localContainerRef.current);
          }
          await client.publish([micTrack, camTrack]);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to start call");
        }
      }
    })();

    return () => {
      cancelled = true;
      const client = clientRef.current;
      const mic = micTrackRef.current;
      const cam = camTrackRef.current;

      try {
        if (mic?.setEnabled) mic.setEnabled(false);
      } catch {
        // ignore
      }

      void (async () => {
        try {
          if (client) {
            await client.leave();
          }
        } catch {
          // ignore
        }
        try {
          await mic?.close?.();
        } catch {
          // ignore
        }
        try {
          await cam?.close?.();
        } catch {
          // ignore
        }
      })();
      clientRef.current = null;
      micTrackRef.current = null;
      camTrackRef.current = null;
      remoteAudioTrackRef.current = null;
    };
  }, [phase, channelName, token, uid, appId, callType]);

  useEffect(() => {
    const mic = micTrackRef.current;
    if (!mic?.setEnabled) return;
    mic.setEnabled(!muted);
  }, [muted]);

  useEffect(() => {
    const track = remoteAudioTrackRef.current;
    if (!track) return;
    if (typeof track.setVolume === "function") {
      track.setVolume(speakerEnabled ? 100 : 0);
    }
  }, [speakerEnabled]);

  useEffect(() => {
    const cam = camTrackRef.current;
    if (!cam?.setEnabled) return;
    cam.setEnabled(cameraEnabled);
  }, [cameraEnabled]);

  const showIncomingModal = phase === "incoming";
  const showCallingUi = phase === "calling" || phase === "active";

  const displayName = callerName ?? astrologerName;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
      {showIncomingModal ? (
        <div className="relative w-full max-w-md rounded-2xl bg-slate-950 p-6 text-white shadow-2xl ring-1 ring-white/10">
          {/** Incoming call modal */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl font-bold ring-2 ring-white/20">
                {initials(displayName)}
              </div>
              <div>
                <div className="text-sm text-white/70">Incoming {callType} Call</div>
                <div className="text-base font-semibold">{displayName}</div>
              </div>
            </div>
            <div className="text-xs font-semibold text-amber-200">
              Auto-declining in {countdown}s...
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 m-auto h-20 w-20 animate-ping rounded-full bg-emerald-400/25" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-400/40">
                <span className="text-xl font-bold text-emerald-200">R</span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => onAcceptCall?.()}
              disabled={countdown <= 0}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => onDeclineCall?.()}
              disabled={countdown <= 0}
              className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
            >
              Decline
            </button>
          </div>
        </div>
      ) : null}

      {showCallingUi ? (
        <div className="relative w-full max-w-5xl rounded-2xl bg-slate-950 shadow-2xl">
          {error ? (
            <div className="rounded-t-2xl border-b border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {callType === "voice" ? (
            <div className="relative flex min-h-[70vh] flex-col items-center justify-center p-6 text-white">
              {/** Call ring + avatar */}
              <div className="relative flex flex-col items-center">
                <div className="absolute -inset-3 rounded-full bg-emerald-400/10 blur-xl" />
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-white/10 ring-2 ring-emerald-400/40">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-950 text-2xl font-bold text-emerald-200 ring-2 ring-emerald-400/30">
                    {initials(astrologerName)}
                  </div>
                </div>

                {phase === "calling" ? (
                  <div className="mt-4 h-4 w-4 animate-pulse rounded-full bg-emerald-400" />
                ) : null}
              </div>

              <div className="mt-6 text-center">
                <div className="text-lg font-bold">{astrologerName}</div>
                <div className="mt-1 text-sm text-white/70">
                  {phase === "calling" ? "Voice Call (connecting...)" : "Voice Call"}
                </div>
              </div>

              <div className="absolute right-4 top-4 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                ₹{chargedSoFar.toFixed(0)} charged so far
              </div>

              {elapsedSeconds != null ? (
                <div className="absolute left-4 top-4 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                  {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60)
                    .toString()
                    .padStart(2, "0")}
                </div>
              ) : null}

              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    {muted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpeakerEnabled((s) => !s)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    {speakerEnabled ? "Speaker" : "Muted Audio"}
                  </button>
                  <button
                    type="button"
                    onClick={onEndCall}
                    className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-red-600"
                  >
                    End Call
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative min-h-[70vh]">
              {/** Remote video */}
              <div
                ref={remoteContainerRef}
                className="absolute inset-0 bg-black"
              />

              {/** Local pip */}
              <div className="absolute bottom-24 right-6 w-40 overflow-hidden rounded-xl ring-1 ring-white/10 bg-black/50">
                <div
                  ref={localContainerRef}
                  className="aspect-video w-full"
                />
              </div>

              <div className="absolute right-4 top-4 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10">
                ₹{chargedSoFar.toFixed(0)} charged so far
              </div>

              <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    {muted ? "Unmute" : "Mute"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCameraEnabled((c) => !c)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                  >
                    {cameraEnabled ? "Camera Off" : "Camera On"}
                  </button>
                  <button
                    type="button"
                    onClick={onEndCall}
                    className="rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-red-600"
                  >
                    End Call
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

