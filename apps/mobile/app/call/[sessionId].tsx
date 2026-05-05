import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { connectSocket, socket } from "../../lib/socket";
import { useAppStore } from "../../lib/store";

export default function ActiveCallScreen() {
  const { sessionId, name } = useLocalSearchParams<{ sessionId: string; name?: string }>();
  const router = useRouter();
  const token = useAppStore((state) => state.token);

  const [status, setStatus] = useState<"calling" | "connected" | "ended">("calling");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!token || !sessionId) return;

    connectSocket(token);
    socket.emit("join_session", { sessionId });

    const appStateSub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        connectSocket(token);
        socket.emit("join_session", { sessionId });
      }
    });

    socket.on("session_started", (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) setStatus("connected");
    });

    socket.on("session_starting", (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) setStatus("connected");
    });

    socket.on("session_tick", (data: { elapsedSeconds: number }) => {
      setElapsed(data.elapsedSeconds);
      setStatus("connected");
    });

    socket.on("session_cancelled", () => {
      if (!endedRef.current) {
        endedRef.current = true;
        setStatus("ended");
        setTimeout(() => router.back(), 1500);
      }
    });

    socket.on("session_ended", () => {
      if (!endedRef.current) {
        endedRef.current = true;
        setStatus("ended");
        setTimeout(() => router.back(), 1500);
      }
    });

    return () => {
      appStateSub.remove();
      socket.off("session_started");
      socket.off("session_starting");
      socket.off("session_tick");
      socket.off("session_cancelled");
      socket.off("session_ended");
    };
  }, [sessionId, token]);

  const handleEndCall = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    socket.emit("end_session", { sessionId });
    setStatus("ended");
    setTimeout(() => router.back(), 500);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
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

      <View style={styles.controls}>
        <Pressable style={styles.controlBtn}>
          <Ionicons name={muted ? "mic-off" : "mic"} size={22} color="#FFFFFF" />
        </Pressable>

        <Pressable
          style={[styles.endCallBtn, status === "ended" && styles.endCallBtnDisabled]}
          onPress={handleEndCall}
          disabled={status === "ended"}
        >
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
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
  controls: {
    flexDirection: "row",
    gap: 24,
    alignItems: "center",
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
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
