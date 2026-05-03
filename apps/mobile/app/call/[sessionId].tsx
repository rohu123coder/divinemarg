import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createAgoraRtcEngine, {
  ChannelMediaOptions,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcConnection,
  RtcEngineContext,
  UserOfflineReasonType,
} from "react-native-agora";

import api from "../../lib/api";
import { useAppStore } from "../../lib/store";
import { firstName } from "../../lib/utils";

export default function ActiveCallScreen() {
  const { sessionId, callType: callTypeParam } = useLocalSearchParams<{
    sessionId: string;
    callType?: string;
  }>();
  const router = useRouter();
  const astrologers = useAppStore((state) => state.astrologers);
  const astro = astrologers.find((a) => a.id === sessionId) ?? astrologers[0];

  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<IRtcEngine | null>(null);

  const callType = callTypeParam === "video" ? "video" : "voice";

  useEffect(() => {
    let cancelled = false;

    const startCall = async () => {
      try {
        setLoading(true);
        const res = await api.get(
          `/api/sessions/${sessionId}/call-token?type=${callType}`
        );
        const { appId, channelName, token, uid } = res.data?.data ?? {};

        if (!appId || !channelName || !token) {
          setError("Could not get call credentials. Please try again.");
          return;
        }

        if (cancelled) return;

        const engine = createAgoraRtcEngine();
        engineRef.current = engine;

        const context = new RtcEngineContext();
        context.appId = appId;
        engine.initialize(context);

        await engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
        await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
        await engine.enableAudio();

        if (callType === "video") {
          await engine.enableVideo();
        }

        const onJoinChannelSuccess = (_connection: RtcConnection, _elapsed: number) => {
          if (!cancelled) setJoined(true);
        };

        const onUserOffline = (
          _connection: RtcConnection,
          _remoteUid: number,
          _reason: UserOfflineReasonType
        ) => {
          if (!cancelled) {
            Alert.alert("Call Ended", "The other person has left the call.");
            router.back();
          }
        };

        const onError = (errorCode: number, msg: string) => {
          console.error("Agora error:", errorCode, msg);
        };

        engine.addListener("onJoinChannelSuccess", onJoinChannelSuccess);
        engine.addListener("onUserOffline", onUserOffline);
        engine.addListener("onError", onError);

        const uidNum =
          uid === undefined || uid === null ? 0 : typeof uid === "number" ? uid : Number(uid);

        const mediaOptions = new ChannelMediaOptions();
        mediaOptions.channelProfile = ChannelProfileType.ChannelProfileCommunication;
        mediaOptions.clientRoleType = ClientRoleType.ClientRoleBroadcaster;
        mediaOptions.publishMicrophoneTrack = true;
        mediaOptions.autoSubscribeAudio = true;
        mediaOptions.autoSubscribeVideo = callType === "video";
        if (callType === "video") {
          mediaOptions.publishCameraTrack = true;
        }

        engine.joinChannel(token, channelName, Number.isFinite(uidNum) ? uidNum : 0, mediaOptions);
      } catch (e) {
        if (!cancelled) {
          console.error("Call start failed:", e);
          setError("Failed to start call. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void startCall();

    return () => {
      cancelled = true;
      const engine = engineRef.current;
      if (engine) {
        engine.removeAllListeners();
        engine.leaveChannel();
        engine.release();
        engineRef.current = null;
      }
    };
  }, [sessionId, callType]);

  const handleEndCall = async () => {
    const engine = engineRef.current;
    if (engine) {
      engine.removeAllListeners();
      await engine.leaveChannel();
      await engine.release();
      engineRef.current = null;
    }
    router.back();
  };

  const toggleMute = async () => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.muteLocalAudioStream(!muted);
    setMuted(!muted);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.endBtn} onPress={() => router.back()}>
          <Text style={styles.endBtnTxt}>Go Back</Text>
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
        <Text style={styles.nameTxt}>{firstName(astro?.name ?? "Astrologer")}</Text>
      </View>

      <View style={styles.avatarWrap}>
        {loading ? (
          <ActivityIndicator color="#D4AF37" size="large" />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {(astro?.name ?? "A").slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.controlBtn} onPress={toggleMute}>
          <Ionicons
            name={muted ? "mic-off" : "mic"}
            size={22}
            color="#FFFFFF"
          />
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
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatarCircle: {
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
  endBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  endBtnTxt: { color: "#FFFFFF", fontWeight: "700" },
});
