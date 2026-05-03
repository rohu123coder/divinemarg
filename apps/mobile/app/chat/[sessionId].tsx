import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../lib/api";
import { firstName } from "../../lib/utils";
import { connectSocket, disconnectSocket, socket } from "../../lib/socket";
import { useAppStore } from "../../lib/store";

type Message = {
  id: string;
  message: string;
  timestamp: string;
  mine: boolean;
};

const isValidUUID = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export default function ChatScreen() {
  const { sessionId, name, photo } = useLocalSearchParams<{
    sessionId: string;
    name?: string;
    photo?: string;
  }>();
  const router = useRouter();
  const token = useAppStore((state) => state.token);
  const flatRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionEnded, setSessionEnded] = useState(true);
  const [astrologerName, setAstrologerName] = useState(
    name && name !== "undefined" ? name : ""
  );
  const [astrologerPhoto, setAstrologerPhoto] = useState<string | null>(
    photo && photo !== "undefined" && photo !== "" ? photo : null
  );
  const [input, setInput] = useState("");

  const fetchMessages = useCallback(async () => {
    if (!sessionId || !isValidUUID(sessionId)) {
      setLoading(false);
      setSessionEnded(true);
      return;
    }

    try {
      setLoading(true);

      // Run both calls in parallel
      const [ctxRes, msgRes] = await Promise.all([
        api.get(`/api/sessions/${sessionId}/context`),
        api.get(`/api/chat/history/${sessionId}/messages`),
      ]);

      // Set astrologer info
      if (ctxRes.data?.data) {
        setAstrologerName(ctxRes.data.data.astrologer_name ?? "Astrologer");
        setAstrologerPhoto(ctxRes.data.data.profile_photo_url ?? null);
      }

      // Map messages
      const raw = msgRes.data?.data?.messages ?? [];
      const mapped: Message[] = raw.map((m: {
        id?: string;
        sender_role: "user" | "astrologer";
        content: string;
        created_at: string;
      }) => ({
        id: m.id ?? `msg-${Math.random()}`,
        message: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        mine: m.sender_role === "user",
      }));
      setMessages(mapped);

      // Check if this session is active (from history list)
      try {
        const histRes = await api.get("/api/chat/history?page=1&limit=50");
        const sessions = histRes.data?.data?.sessions ?? [];
        const thisSession = sessions.find(
          (s: { id: string; status?: string }) => s.id === sessionId
        );
        setSessionEnded(thisSession?.status === "ended");
      } catch {
        setSessionEnded(false); // default to active if check fails
      }
    } catch (e) {
      console.error("Failed to load chat:", e);
      setSessionEnded(true);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!token || !sessionId || !isValidUUID(sessionId)) return;
    connectSocket(token);
    socket.emit("join_session", { sessionId });
    socket.on("new_message", (payload: { content: string; sender_type?: string; senderType?: string }) => {
      const senderType = payload.sender_type ?? payload.senderType ?? "";
      // Ignore messages sent by user themselves (already added locally)
      if (senderType === "user") return;
      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          message: payload.content,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          mine: false,
        },
      ]);
      setSessionEnded(false);
    });
    socket.on("session_ended", () => {
      setSessionEnded(true);
    });
    return () => {
      socket.off("new_message");
      socket.off("session_ended");
      disconnectSocket();
    };
  }, [sessionId, token]);

  const send = () => {
    const msg = input.trim();
    if (!msg || sessionEnded) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        message: msg,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mine: true,
      },
    ]);
    socket.emit("send_message", { sessionId, content: msg });
    setInput("");
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 10 }}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </Pressable>
        {astrologerPhoto ? (
          <Image
            source={{ uri: astrologerPhoto }}
            style={styles.photo}
            onError={() => setAstrologerPhoto(null)}
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]} />
        )}
        <Text style={styles.name}>{firstName(astrologerName)}</Text>
        {!sessionEnded && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeTxt}>LIVE</Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            loading ? null : (
              <Text style={styles.empty}>No messages in this session.</Text>
            )
          }
          renderItem={({ item }) => (
            <View style={[styles.bubbleRow, item.mine ? styles.rowMine : styles.rowOther]}>
              <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleOther]}>
                <Text style={[styles.msgText, item.mine ? styles.msgMine : styles.msgOther]}>
                  {item.message}
                </Text>
                <Text style={[styles.time, item.mine ? styles.timeMine : styles.timeOther]}>
                  {item.timestamp}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Show ended banner OR composer */}
        {sessionEnded ? (
          <View style={styles.endedBanner}>
            <Text style={styles.endedText}>This session has ended</Text>
          </View>
        ) : (
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
            />
            <Pressable style={styles.sendBtn} onPress={send}>
              <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  photo: { width: 34, height: 34, borderRadius: 17 },
  photoPlaceholder: { backgroundColor: "#E5E7EB" },
  name: { flex: 1, color: "#1A1A2E", fontWeight: "700", fontSize: 15 },
  activeBadge: {
    backgroundColor: "#10B981",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  messages: { padding: 12, paddingBottom: 20 },
  bubbleRow: { marginBottom: 8, flexDirection: "row" },
  rowMine: { justifyContent: "flex-end" },
  rowOther: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: "#7C3AED" },
  bubbleOther: { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgMine: { color: "#FFFFFF" },
  msgOther: { color: "#1A1A2E" },
  time: { marginTop: 4, fontSize: 11, textAlign: "right" },
  timeMine: { color: "rgba(255,255,255,0.7)" },
  timeOther: { color: "#9CA3AF" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 60 },
  endedBanner: {
    padding: 14,
    backgroundColor: "#F9FAFB",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  endedText: { color: "#6B7280", fontSize: 13 },
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
});
