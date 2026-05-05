import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, AppState, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
} from "react-native-agora";
import { connectSocket, socket } from "../../lib/socket";
import { useAppStore } from "../../lib/store";

const AGORA_APP_ID = "4fb8572dc9c2444aaebd591e33b2bde5";

export default function ActiveCallScreen() {
  const { sessionId, name } = useLocalSearchParams<{ sessionId: string; name?: string }>();
  const router = useRouter();
  const token = useAppStore((state) => state.token);

  const [status, setStatus] = useState<"calling" | "connected" | "ended">("calling");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);

  const engineRef = useRef<IRtcEngine | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!token || !sessionId) return;

    connectSocket(token);
    socket.emit("join_session", { sessionId });

    // Keep socket alive when app goes to background
    const appStateSub = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active") {
        connectSocket(token);
        socket.emit("join_session", { sessionId });
      }
    });

    socket.on("session_started", (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        socket.emit("initiate_call", { sessionId, callType: "voice" });
      }
    });

    socket.on("session_starting", (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        socket.emit("initiate_call", { sessionId, callType: "voice" });
      }
    });

    socket.on("call_ready", async (data: {
      channelName: string;
      token: string;
      uid: number;
      appId: string;
    }) => {
      try {
        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        engine.initialize({
          appId: AGORA_APP_ID,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });

        engine.enableAudio();
        engine.disableVideo();
        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

        engine.addListener("onUserJoined", () => {
          setStatus("connected");
        });

        engine.addListener("onUserOffline", () => {
          if (!endedRef.current) {
            endedRef.current = true;
            cleanupAndExit();
          }
        });

        engine.addListener("onError", (err) => {
          console.error("Agora error:", err);
        });

        engine.joinChannel(data.token, data.channelName, data.uid, {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
        });

        setStatus("connected");
      } catch (e) {
        console.error("Agora init error:", e);
      }
    });

    socket.on("session_tick", (data: { elapsedSeconds: number }) => {
      setElapsed(data.elapsedSeconds);
      if (status === "calling") setStatus("connected");
    });

    socket.on("session_cancelled", () => {
      if (!endedRef.current) {
        endedRef.current = true;
        cleanupAndExit();
      }
    });

    socket.on("session_ended", () => {
      if (!endedRef.current) {
        endedRef.current = true;
        cleanupAndExit();
      }
    });

    socket.on("call_declined", () => {
      if (!endedRef.current) {
        endedRef.current = true;
        cleanupAndExit();
      }
    });

    return () => {
      appStateSub.remove();
      socket.off("session_started");
      socket.off("session_starting");
      socket.off("call_ready");
      socket.off("session_tick");
      socket.off("session_cancelled");
      socket.off("session_ended");
      socket.off("call_declined");
    };
  }, [sessionId, token]);

  const cleanupAndExit = async () => {
    try {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
    } catch (e) {
      console.error("Agora cleanup error:", e);
    }
    setStatus("ended");
    setTimeout(() => router.back(), 1000);
  };

  const handleEndCall = () => {
    if (!endedRef.current) {
      endedRef.current = true;
      socket.emit("end_session", { sessionId });
      cleanupAndExit();
    }
  };

  const toggleMute = async () => {
    if (engineRef.current) {
      engineRef.current.muteLocalAudioStream(!muted);
      setMuted(!muted);
    }
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
        <Pressable
          style={[styles.controlBtn, muted && styles.controlBtnActive]}
          onPress={toggleMute}
        >
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
  controlBtnActive: {
    backgroundColor: "#7C3AED",
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
