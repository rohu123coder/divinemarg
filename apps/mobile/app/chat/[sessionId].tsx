import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, type Socket } from "socket.io-client";

import { baseURL } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import type { ChatMessage } from "../../lib/types";

const PRIMARY = "#7C3AED";
const LIGHT = "#EDE9FE";

export default function ChatScreen() {
  const { sessionId, name: nameParam } = useLocalSearchParams<{
    sessionId: string;
    name?: string;
  }>();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);

  const astrologerName = useMemo(() => {
    if (!nameParam) return "Astrologer";
    try {
      return decodeURIComponent(nameParam);
    } catch {
      return nameParam;
    }
  }, [nameParam]);

  const [status, setStatus] = useState<string>("connecting");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const summaryShown = useRef(false);
  const lowBalanceRef = useRef(false);

  useEffect(() => {
    summaryShown.current = false;
    lowBalanceRef.current = false;
    setMessages([]);
    setStatus("connecting");
    setStartedAt(null);
    setElapsedSec(0);
  }, [sessionId]);

  useEffect(() => {
    if (!isLoggedIn || !token || !sessionId) {
      return;
    }

    const socket = io(baseURL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_session", { sessionId });
    });

    socket.on("connect_error", () => {
      setStatus("error");
    });

    socket.on(
      "joined_session",
      (payload: { sessionId: string; status: string }) => {
        if (payload.sessionId !== sessionId) return;
        setStatus(payload.status);
      }
    );

    socket.on(
      "session_started",
      (payload: { sessionId: string; startedAt: string }) => {
        if (payload.sessionId !== sessionId) return;
        setStatus("active");
        setStartedAt(payload.startedAt);
      }
    );

    socket.on("new_message", (msg: ChatMessage) => {
      if (msg.sessionId !== sessionId) return;
      setMessages((prev) => [...prev, msg]);
    });

    socket.on(
      "session_ended",
      (payload: {
        sessionId: string;
        totalMinutes: number;
        totalCharged: number;
      }) => {
        if (payload.sessionId !== sessionId) return;
        if (summaryShown.current) return;
        summaryShown.current = true;
        if (lowBalanceRef.current) {
          lowBalanceRef.current = false;
          router.back();
          return;
        }
        Alert.alert(
          "Session ended",
          `Duration: ${payload.totalMinutes} min\nCharged: ₹${payload.totalCharged}`,
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    );

    socket.on("insufficient_balance", (payload: { sessionId: string }) => {
      if (payload.sessionId !== sessionId) return;
      lowBalanceRef.current = true;
      Alert.alert(
        "Low balance",
        "Your wallet balance is too low to continue. The session will end."
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn, router, sessionId, token]);

  useEffect(() => {
    if (status !== "active" || !startedAt) {
      return;
    }
    const tick = () => {
      const ms = Date.now() - new Date(startedAt).getTime();
      setElapsedSec(Math.max(0, Math.floor(ms / 1000)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, status]);

  const fmtTime = (total: number) => {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const send = () => {
    const text = input.trim();
    if (!text || !sessionId) return;
    socketRef.current?.emit("send_message", { sessionId, content: text });
    setInput("");
  };

  const endSession = useCallback(() => {
    Alert.alert("End chat", "End this session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: () => {
          socketRef.current?.emit("end_session", { sessionId });
        },
      },
    ]);
  }, [sessionId]);

  const listData = useMemo(
    () => [...messages].reverse(),
    [messages]
  );

  if (!sessionId) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.err}>Invalid session</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerBtn}>
            <Ionicons name="arrow-back" size={22} color={PRIMARY} />
          </Pressable>
          <View style={styles.headerMid}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {astrologerName}
            </Text>
            <Text style={styles.headerSub}>
              {status === "active"
                ? fmtTime(elapsedSec)
                : status === "waiting"
                  ? "Waiting for astrologer…"
                  : status === "connecting"
                    ? "Connecting…"
                    : status}
            </Text>
          </View>
          <Pressable onPress={endSession} style={styles.endBtn}>
            <Text style={styles.endTxt}>End</Text>
          </Pressable>
        </View>

        {status === "error" ? (
          <View style={styles.centered}>
            <Text style={styles.err}>Could not connect. Try again.</Text>
          </View>
        ) : (
          <FlatList
            data={listData}
            inverted
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const mine =
                item.senderType === "user" && item.senderId === user?.id;
              return (
                <View
                  style={[
                    styles.bubbleRow,
                    mine ? styles.bubbleRowMine : styles.bubbleRowThem,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      mine ? styles.bubbleMine : styles.bubbleThem,
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleTxt,
                        mine ? styles.bubbleTxtMine : styles.bubbleTxtThem,
                      ]}
                    >
                      {item.content}
                    </Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {status === "waiting"
                  ? "Say hi while you wait…"
                  : "No messages yet."}
              </Text>
            }
          />
        )}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Message…"
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <Pressable style={styles.send} onPress={send}>
            {status === "connecting" ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: LIGHT,
  },
  headerBtn: {
    padding: 8,
  },
  headerMid: {
    flex: 1,
    marginHorizontal: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  headerSub: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  endBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  endTxt: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 16,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  bubbleRow: {
    marginBottom: 8,
    flexDirection: "row",
  },
  bubbleRowMine: {
    justifyContent: "flex-end",
  },
  bubbleRowThem: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: PRIMARY,
  },
  bubbleThem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LIGHT,
  },
  bubbleTxt: {
    fontSize: 16,
    lineHeight: 22,
  },
  bubbleTxtMine: {
    color: "#fff",
  },
  bubbleTxtThem: {
    color: "#111827",
  },
  empty: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 24,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: LIGHT,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: LIGHT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  send: {
    backgroundColor: PRIMARY,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  err: {
    color: "#B91C1C",
    fontSize: 15,
    textAlign: "center",
    margin: 24,
  },
});
