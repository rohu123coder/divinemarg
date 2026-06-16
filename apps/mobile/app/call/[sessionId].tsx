import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
} from "react-native-agora";
import { connectSocket, socket } from "../../lib/socket";
import { useAppStore } from "../../lib/store";

type CallStatus = "connecting" | "connected" | "ended" | "error";

export default function ActiveCallScreen() {
  const { sessionId, name, channelName, agoraToken, uid, appId } =
    useLocalSearchParams<{
      sessionId: string;
      name?: string;
      channelName?: string;
      agoraToken?: string;
      uid?: string;
      appId?: string;
    }>();
  const router = useRouter();
  const token = useAppStore((state) => state.token);

  const [status, setStatus] = useState<CallStatus>("connecting");
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);

  const engineRef = useRef<IRtcEngine | null>(null);
  const endedRef = useRef(false);

  useEffect(() => {
    if (!token || !sessionId) return;
    connectSocket(token);
    socket.emit("join_session", { sessionId });

    socket.on("session_tick", (data: { elapsedSeconds: number }) => {
      setElapsed(data.elapsedSeconds);
    });

    socket.on("session_ended", () => {
      if (!endedRef.current) {
        endedRef.current = true;
        cleanupAndExit();
      }
    });

    socket.on("session_cancelled", () => {
      if (!endedRef.current) {
        endedRef.current = true;
        cleanupAndExit();
      }
    });

    // Join Agora if params available
    if (channelName && agoraToken && uid && appId) {
      void joinAgora();
    }

    return () => {
      socket.off("session_tick");
      socket.off("session_ended");
      socket.off("session_cancelled");
    };
  }, [sessionId, token]);

  const joinAgora = async () => {
    try {
      setStatus("connecting");

      if (engineRef.current) {
        try {
          engineRef.current.leaveChannel();
          engineRef.current.release();
        } catch {
          // ignore cleanup errors on retry
        }
        engineRef.current = null;
      }

      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      engine.initialize({
        appId: appId ?? "4fb8572dc9c2444aaebd591e33b2bde5",
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone Permission",
            message: "DivineMarg needs microphone access for voice calls.",
            buttonPositive: "OK",
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setStatus("error");
          console.error("Microphone permission denied");
          return;
        }
      }

      engine.enableAudio();
      engine.setDefaultAudioRouteToSpeakerphone(true);
      engine.setEnableSpeakerphone(true);
      engine.disableVideo();
      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      engine.addListener("onJoinChannelSuccess", (connection, _elapsed) => {
        console.log("Agora joined channel successfully", connection);
        setStatus("connected");
      });

      engine.addListener("onUserJoined", () => {
        setStatus("connected");
      });

      engine.addListener("onError", (err) => {
        console.error("Agora error:", err);
      });

      (engine as IRtcEngine & {
        addListener(event: "onWarning", callback: (warn: number) => void): void;
      }).addListener("onWarning", (warn) => {
        console.warn("Agora warning:", warn);
      });

      engine.addListener(
        "onRemoteAudioStateChanged",
        (_connection, remoteUid, state, reason) => {
          console.log("Remote audio state changed:", { remoteUid, state, reason });
        }
      );

      engine.addListener("onLocalAudioStateChanged", (state, error) => {
        console.log("Local audio state changed:", { state, error });
      });

      await engine.joinChannel(agoraToken!, channelName!, parseInt(uid!, 10), {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
        publishMicrophoneTrack: true,
        autoSubscribeAudio: true,
      });
    } catch (e) {
      console.error("Agora join error:", e);
      setStatus("error");
    }
  };

  const cleanupAndExit = async () => {
    try {
      if (engineRef.current) {
        engineRef.current.leaveChannel();
        engineRef.current.release();
        engineRef.current = null;
      }
    } catch (e) {
      console.error("Agora cleanup:", e);
    }
    setStatus("ended");
    setTimeout(() => router.back(), 1000);
  };

  const handleEndCall = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    socket.emit("end_session", { sessionId });
    cleanupAndExit();
  };

  const toggleMute = () => {
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

  const statusLabel =
    status === "connecting"
      ? "Connecting..."
      : status === "connected"
        ? "Connected"
        : status === "error"
          ? "Microphone permission required"
          : "Call Ended";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.statusTxt, status === "error" && styles.statusError]}>
          {statusLabel}
        </Text>
        <Text style={styles.nameTxt}>{name ?? "Astrologer"}</Text>
        {status === "connected" && (
          <Text style={styles.timerTxt}>{formatTime(elapsed)}</Text>
        )}
      </View>

      {status === "error" ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            Allow microphone access in Settings to use voice calls.
          </Text>
          <View style={styles.errorActions}>
            <Pressable style={styles.retryBtn} onPress={() => void joinAgora()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
            <Pressable
              style={styles.settingsBtn}
              onPress={() => void Linking.openSettings()}
            >
              <Text style={styles.settingsBtnText}>Open Settings</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarIcon}>📞</Text>
        </View>
      )}

      <View style={styles.controls}>
        <Pressable
          style={[styles.controlBtn, muted && styles.controlBtnActive]}
          onPress={toggleMute}
          disabled={status !== "connected"}
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
  statusError: { color: "#FCA5A5" },
  nameTxt: { color: "#E5E7EB", fontSize: 16 },
  timerTxt: { color: "#9CA3AF", fontSize: 14, fontFamily: "monospace" },
  errorBanner: {
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#7F1D1D33",
    borderWidth: 1,
    borderColor: "#EF444466",
    gap: 12,
  },
  errorText: { color: "#FECACA", fontSize: 14, textAlign: "center" },
  errorActions: { flexDirection: "row", gap: 12, justifyContent: "center" },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
  },
  retryBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
  settingsBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#374151",
  },
  settingsBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 14 },
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
  controlBtnActive: { backgroundColor: "#7C3AED" },
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
