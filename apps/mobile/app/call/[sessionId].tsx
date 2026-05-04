import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createAgoraRtcEngine, {
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  ChannelMediaOptions,
} from "react-native-agora";

import api from "../../lib/api";
import { connectSocket, disconnectSocket, socket } from "../../lib/socket";
import { useAppStore } from "../../lib/store";
import { firstName } from "../../lib/utils";

export default function ActiveCallScreen() {
  const { sessionId, callType: callTypeParam, name: nameProp } = useLocalSearchParams<{
    sessionId: string;
    callType?: string;
    name?: string;
  }>();
  const router = useRouter();
  const token = useAppStore((state) => state.token);
  const astrologers = useAppStore((state) => state.astrologers);
  const astro = astrologers.find((a) => a.id === sessionId);
  const displayName = nameProp ?? astro?.name ?? "Astrologer";

  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(true);
  const engineRef = useRef<IRtcEngine | null>(null);
  const callType = callTypeParam === "video" ? "video" : "voice";

  useEffect(() => {
    if (!token || !sessionId) return;
    connectSocket(token);
    socket.emit("join_session", { sessionId });
    socket.on("session_starting", () => {
      setWaiting(false);
    });
    socket.on("session_cancelled", () => {
      Alert.alert("Call Declined", "Astrologer declined the call.");
      router.back();
    });
    return () => {
      socket.off("session_starting");
      socket.off("session_cancelled");
      disconnectSocket();
    };
  }, [sessionId, token]);

  useEffect(() => {
    if (waiting) return;
    let cancelled = false;

    const startCall = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/sessions/${sessionId}/call-token?type=${callType}`);
        const { appId, channelName, token: rtcToken, uid } = res.data?.data ?? {};

        if (!appId || !channelName || !rtcToken) {
          setError("Could not get call credentials.");
          return;
        }
        if (cancelled) return;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;
        engine.initialize({ appId });
        engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
        engine.enableAudio();

        engine.addListener("onJoinChannelSuccess", () => {
          if (!cancelled) setJoined(true);
        });

        engine.addListener("onUserOffline", () => {
          if (!cancelled) {
            Alert.alert("Call Ended", "The other person has left.");
            router.back();
          }
        });

        const options: ChannelMediaOptions = {
          publishMicrophoneTrack: true,
          autoSubscribeAudio: true,
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        };

        engine.joinChannel(rtcToken, channelName, uid ?? 1, options);
      } catch (e) {
        if (!cancelled) setError("Failed to start call.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void startCall();

    return () => {
      cancelled = true;
      engineRef.current?.leaveChannel();
      engineRef.current?.release();
      engineRef.current = null;
    };
  }, [waiting, sessionId, callType]);

  const handleEndCall = () => {
    engineRef.current?.leaveChannel();
    engineRef.current?.release();
    engineRef.current = null;
    router.back();
  };

  const toggleMute = () => {
    engineRef.current?.muteLocalAudioStream(!muted);
    setMuted(!muted);
  };

  if (waiting) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.connectedTxt}>Calling...</Text>
          <Text style={styles.nameTxt}>{firstName(displayName)}</Text>
        </View>
        <View style={styles.avatarWrap}>
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
        <Pressable
          style={styles.endCallBtn}
          onPress={() => {
            socket.emit("end_session", { sessionId });
            router.back();
          }}
        >
          <Ionicons name="call" size={24} color="#FFFFFF" />
        </Pressable>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.endCallBtn} onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.connectedTxt}>
          {loading ? "Connecting..." : joined ? "Connected" : "Waiting..."}
        </Text>
        <Text style={styles.nameTxt}>{firstName(displayName)}</Text>
      </View>
      <View style={styles.avatarWrap}>
        {loading ? (
          <ActivityIndicator color="#D4AF37" size="large" />
        ) : (
          <Text style={styles.avatarInitial}>
            {displayName.slice(0, 1).toUpperCase()}
          </Text>
        )}
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.controlBtn} onPress={toggleMute}>
          <Ionicons name={muted ? "mic-off" : "mic"} size={22} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.endCallBtn} onPress={handleEndCall}>
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
  connectedTxt: { color: "#D4AF37", fontSize: 18, fontWeight: "700" },
  nameTxt: { color: "#E5E7EB", fontSize: 16 },
  avatarWrap: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: { fontSize: 60, color: "#FFFFFF", fontWeight: "800" },
  controls: { flexDirection: "row", gap: 20, alignItems: "center" },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7C3AED",
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
  errorText: { color: "#EF4444", fontSize: 16, textAlign: "center", paddingHorizontal: 24 },
});
