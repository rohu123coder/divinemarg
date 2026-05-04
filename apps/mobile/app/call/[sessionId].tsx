import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../lib/api";
import { connectSocket, socket } from "../../lib/socket";
import { useAppStore } from "../../lib/store";

export default function ActiveCallScreen() {
  const { sessionId, name } = useLocalSearchParams<{ sessionId: string; name?: string }>();
  const router = useRouter();
  const token = useAppStore((state) => state.token);

  useEffect(() => {
    // Test API call
    api.get(`/api/sessions/${sessionId}/context`)
      .then(res => console.log("Session context:", JSON.stringify(res.data)))
      .catch(e => console.error("Session error:", e.response?.data ?? e.message));

    if (token) {
      connectSocket(token);
      socket.emit("join_session", { sessionId });
      console.log("Socket connected, joining session:", sessionId);

      socket.on("incoming_call_request", (data) => {
        console.log("incoming_call_request received:", JSON.stringify(data));
      });

      socket.on("connect", () => {
        console.log("Socket connected!");
      });
    }
  }, [sessionId, token]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.connectedTxt}>Calling...</Text>
        <Text style={styles.nameTxt}>{name ?? "Astrologer"}</Text>
        <Text style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
          Session: {sessionId?.slice(0, 8)}...
        </Text>
      </View>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarInitial}>📞</Text>
      </View>
      <Pressable style={styles.endCallBtn} onPress={() => router.back()}>
        <Ionicons name="call" size={24} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0A1E", alignItems: "center", justifyContent: "space-between", paddingVertical: 48 },
  header: { alignItems: "center", gap: 8 },
  connectedTxt: { color: "#D4AF37", fontSize: 18, fontWeight: "700" },
  nameTxt: { color: "#E5E7EB", fontSize: 16 },
  avatarWrap: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 60 },
  endCallBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", transform: [{ rotate: "135deg" }] },
});
