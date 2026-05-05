import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { connectSocket, socket } from "../../lib/socket";
import { useAppStore } from "../../lib/store";

export default function ActiveCallScreen() {
  const { sessionId, name } = useLocalSearchParams<{ sessionId: string; name?: string }>();
  const router = useRouter();
  const token = useAppStore((state) => state.token);
  const [status, setStatus] = useState<"calling" | "connected" | "ended">("calling");
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!token || !sessionId) return;

    connectSocket(token);

    socket.emit("join_session", { sessionId });
    console.log("[CALL] Joining session:", sessionId);

    socket.on("session_started", (data: { sessionId: string }) => {
      console.log("[CALL] session_started received:", data);
      if (data.sessionId === sessionId) {
        setStatus("connected");
        timerRef.current = setInterval(() => {
          setElapsed((e) => e + 1);
        }, 1000);
      }
    });

    socket.on("session_starting", (data: { sessionId: string }) => {
      console.log("[CALL] session_starting received:", data);
      if (data.sessionId === sessionId) {
        setStatus("connected");
        timerRef.current = setInterval(() => {
          setElapsed((e) => e + 1);
        }, 1000);
      }
    });

    socket.on("session_tick", (data: { elapsedSeconds: number }) => {
      setElapsed(data.elapsedSeconds);
      if (status === "calling") setStatus("connected");
    });

    socket.on("session_cancelled", () => {
      setStatus("ended");
      setTimeout(() => router.back(), 2000);
    });

    socket.on("session_ended", () => {
      setStatus("ended");
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => router.back(), 2000);
    });

    return () => {
      socket.off("session_started");
      socket.off("session_starting");
      socket.off("session_tick");
      socket.off("session_cancelled");
      socket.off("session_ended");
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, token]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleEndCall = () => {
    socket.emit("end_session", { sessionId });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.statusTxt}>
          {status === "calling" ? "Calling..." : status === "connected" ? "Connected" : "Call Ended"}
        </Text>
        <Text style={styles.nameTxt}>{name ?? "Astrologer"}</Text>
        {status === "connected" && (
          <Text style={styles.timerTxt}>{formatTime(elapsed)}</Text>
        )}
      </View>

      <View style={styles.avatarWrap}>
        <Text style={styles.avatarIcon}>📞</Text>
      </View>

      <Pressable
        style={[styles.endCallBtn, status === "ended" && styles.endCallBtnDisabled]}
        onPress={handleEndCall}
        disabled={status === "ended"}
      >
        <Ionicons name="call" size={24} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0A1E",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 48,
  },
  header: { alignItems: "center", gap: 8 },
  statusTxt: { color: "#D4AF37", fontSize: 18, fontWeight: "700" },
  nameTxt: { color: "#E5E7EB", fontSize: 16 },
  timerTxt: { color: "#9CA3AF", fontSize: 14, fontFamily: "monospace" },
  avatarWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: { fontSize: 60 },
  endCallBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "135deg" }],
  },
  endCallBtnDisabled: { backgroundColor: "#6B7280" },
});
