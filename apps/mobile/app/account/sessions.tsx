import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../lib/api";
import { firstName } from "../../lib/utils";

type Session = {
  id: string;
  astrologer_name: string;
  astrologer_photo: string | null;
  mode: string;
  started_at: string;
  duration_minutes: number;
  amount_charged: number;
  status: string;
};

export default function SessionsScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/chat/history?page=1&limit=50");
      const raw = res.data?.data?.sessions ?? res.data?.data ?? [];
      const mapped: Session[] = raw.map((item: {
        id: string;
        astrologer_name?: string;
        astrologer_photo?: string | null;
        session_type?: string;
        started_at?: string;
        total_minutes?: number;
        total_charged?: number;
        status?: string;
      }) => ({
        id: item.id,
        astrologer_name: item.astrologer_name ?? "Astrologer",
        astrologer_photo: item.astrologer_photo ?? null,
        mode: item.session_type ?? "chat",
        started_at: item.started_at ?? "",
        duration_minutes: item.total_minutes ?? 0,
        amount_charged: item.total_charged ?? 0,
        status: item.status ?? "ended",
      }));
      setSessions(mapped);
    } catch (e) {
      console.error("Failed to fetch sessions:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
      " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
        </Pressable>
        <Text style={styles.headerTitle}>My Sessions</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#7C3AED" size="large" />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No sessions yet. Start chatting with an astrologer!</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: `/chat/${item.id}`,
                  params: {
                    name: item.astrologer_name,
                    photo: item.astrologer_photo ?? "",
                  },
                })
              }
            >
              <Image
                source={{ uri: item.astrologer_photo ?? "https://i.pravatar.cc/100?img=55" }}
                style={styles.avatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{firstName(item.astrologer_name)}</Text>
                <Text style={styles.meta}>
                  {item.mode.toUpperCase()} · {formatDate(item.started_at)}
                </Text>
                <Text style={styles.meta}>
                  {item.duration_minutes} min · ₹{item.amount_charged} · {item.status}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 12,
    marginTop: 10,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  name: { color: "#1A1A2E", fontWeight: "700", fontSize: 14 },
  meta: { marginTop: 3, color: "#6B7280", fontSize: 12 },
  empty: { color: "#6B7280", textAlign: "center", marginTop: 60, fontSize: 14, paddingHorizontal: 32 },
});
