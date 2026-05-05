"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { getSocketApiBase } from "@/lib/socketBase";
import { useAuthStore } from "@/lib/store";

export default function AstrologerCallPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const { sessionId } = params;
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "User";
  const router = useRouter();
  const { token } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<"connected" | "ended">("connected");
  const endedRef = useRef(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(getSocketApiBase(), {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_session", { sessionId });
    });

    socket.io.on("reconnect", () => {
      socket.emit("join_session", { sessionId });
    });

    socket.on("session_tick", (data: { elapsedSeconds: number }) => {
      setElapsed(data.elapsedSeconds);
    });

    const handleEnd = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      setStatus("ended");
      setTimeout(() => router.push("/astrologer/dashboard"), 1500);
    };

    socket.on("session_ended", handleEnd);
    socket.on("session_cancelled", handleEnd);

    return () => {
      socket.off("session_ended");
      socket.off("session_cancelled");
      socket.off("session_tick");
      socket.disconnect();
    };
  }, [sessionId, token, router]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    socketRef.current?.emit("end_session", { sessionId });
    setStatus("ended");
    setTimeout(() => router.push("/astrologer/dashboard"), 1000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-[#0F0A1E] px-4 py-16 text-white">
      <div className="flex flex-col items-center gap-3">
        <p className="text-lg font-bold text-amber-400">Voice Call</p>
        <p className="text-xl font-semibold text-gray-200">{name}</p>
        <p className="font-mono text-gray-400">{formatTime(elapsed)}</p>
        <p className={`text-sm font-semibold ${status === "ended" ? "text-red-400" : "text-emerald-400"}`}>
          {status === "ended" ? "Call Ended" : "● Connected"}
        </p>
      </div>

      <div className="flex h-40 w-40 items-center justify-center rounded-full bg-violet-600 text-6xl">
        📞
      </div>

      <button
        onClick={handleEndCall}
        disabled={status === "ended"}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg disabled:opacity-50"
      >
        📵
      </button>
    </div>
  );
}
