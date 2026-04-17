import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ChatBubble } from "../../components/ChatBubble";
import { connectSocket, disconnectSocket, socket } from "../../lib/socket";
import { useAppStore } from "../../lib/store";

type Message = {
  id: string;
  message: string;
  timestamp: string;
  mine: boolean;
};

export default function ActiveChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const token = useAppStore((state) => state.token);
  const astrologers = useAppStore((state) => state.astrologers);
  const astro = astrologers.find((a) => a.id === sessionId) ?? astrologers[0];
  const [seconds, setSeconds] = useState(0);
  const [input, setInput] = useState("");
  const [incomingCall, setIncomingCall] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "m1", message: "Namaste, how may I help you today?", timestamp: "10:30", mine: false },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!token) return;
    connectSocket(token);
    socket.emit("join_session", { sessionId });

    socket.on("new_message", (payload: { content: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          message: payload.content,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mine: false,
        },
      ]);
    });
    socket.on("incoming_call", () => setIncomingCall(true));

    return () => {
      socket.off("new_message");
      socket.off("incoming_call");
      disconnectSocket();
    };
  }, [sessionId, token]);

  const timerText = useMemo(() => {
    const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
    const ss = (seconds % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }, [seconds]);

  const send = () => {
    const message = input.trim();
    if (!message) return;
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, message, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), mine: true },
    ]);
    socket.emit("new_message", { sessionId, content: message });
    setInput("");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.top}>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
          </Pressable>
          <View style={styles.profile}>
            <Image source={{ uri: astro?.profile_photo ?? "https://i.pravatar.cc/100?img=40" }} style={styles.photo} />
            <Text style={styles.name}>{astro?.name ?? "Astrologer"}</Text>
          </View>
          <Text style={styles.timer}>{timerText}</Text>
          <Pressable style={styles.endBtn} onPress={() => router.back()}>
            <Text style={styles.endText}>End</Text>
          </Pressable>
        </View>

        <View style={styles.callActions}>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="call" size={18} color="#7C3AED" />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="videocam" size={20} color="#7C3AED" />
          </Pressable>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatBubble message={item.message} timestamp={item.timestamp} mine={item.mine} />
          )}
          contentContainerStyle={styles.messages}
        />

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={input}
            onChangeText={setInput}
          />
          <Pressable style={styles.sendBtn} onPress={send}>
            <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={incomingCall} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Image source={{ uri: astro?.profile_photo ?? "https://i.pravatar.cc/100?img=40" }} style={styles.modalPhoto} />
            <Text style={styles.modalName}>{astro?.name}</Text>
            <Text style={styles.modalSub}>Incoming Voice Call...</Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.accept} onPress={() => setIncomingCall(false)}>
                <Text style={styles.modalActionText}>Accept</Text>
              </Pressable>
              <Pressable style={styles.decline} onPress={() => setIncomingCall(false)}>
                <Text style={styles.modalActionText}>Decline</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  profile: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  photo: { width: 30, height: 30, borderRadius: 15 },
  name: { color: "#1A1A2E", fontWeight: "700" },
  timer: { color: "#10B981", fontWeight: "700", fontSize: 12 },
  endBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#FEE2E2" },
  endText: { color: "#EF4444", fontWeight: "700" },
  callActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  messages: { padding: 12 },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCard: { width: 280, borderRadius: 16, backgroundColor: "#FFFFFF", padding: 20, alignItems: "center" },
  modalPhoto: { width: 80, height: 80, borderRadius: 40, marginBottom: 8 },
  modalName: { fontSize: 18, color: "#1A1A2E", fontWeight: "700" },
  modalSub: { marginTop: 4, color: "#6B7280" },
  modalActions: { marginTop: 16, flexDirection: "row", gap: 10 },
  accept: { backgroundColor: "#10B981", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  decline: { backgroundColor: "#EF4444", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  modalActionText: { color: "#FFFFFF", fontWeight: "700" },
});
