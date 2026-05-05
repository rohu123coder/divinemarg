"use client";
import { useLocalSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { getSocketApiBase } from "@/lib/socketBase";
import { useAuthStore } from "@/lib/store";

export default function AstrologerCallPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "User";
  const router = useRouter();
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(getSocketApiBase(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_session", { sessionId });
    });

    socket.on("session_tick", (data: { elapsedSeconds: number }) => {
      setElapsed(data.elapsedSeconds);
    });

    socket.on("session_ended", () => {
      if (timerRef.current) clearInterval(timerRef.current);
      router.push("/astrologer/dashboard");
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId, token, router]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    socketRef.current?.emit("end_session", { sessionId });
    router.push("/astrologer/dashboard");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-[#0F0A1E] px-4 py-16 text-white">
      <div className="flex flex-col items-center gap-3">
        <p className="text-lg font-bold text-amber-400">Voice Call</p>
        <p className="text-xl font-semibold text-gray-200">{name}</p>
        <p className="font-mono text-gray-400">{formatTime(elapsed)}</p>
      </div>

      <div className="flex h-40 w-40 items-center justify-center rounded-full bg-violet-600 text-6xl">
        📞
      </div>

      <button
        onClick={handleEndCall}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg"
      >
        📵
      </button>
    </div>
  );
}
