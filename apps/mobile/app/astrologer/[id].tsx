import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";

const PRIMARY = "#7C3AED";
const LIGHT = "#EDE9FE";

type AstrologerDetail = {
  id: string;
  bio: string | null;
  specializations: string[];
  languages: string[];
  rating: number | null;
  total_reviews: number;
  price_per_minute: number | null;
  is_available: boolean;
  experience_years: number | null;
  user: {
    name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
  };
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_name: string;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AstrologerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);

  const [loading, setLoading] = useState(true);
  const [astro, setAstro] = useState<AstrologerDetail | null>(null);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/astrologers/${id}`);
      const data = res.data?.data as
        | { astrologer?: AstrologerDetail; reviews?: ReviewRow[] }
        | undefined;
      setAstro(data?.astrologer ?? null);
      setReviews(data?.reviews ?? []);
    } catch {
      setAstro(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const startChat = async () => {
    if (!astro) return;
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    const price = astro.price_per_minute ?? 0;
    const minBal = price * 5;
    const bal = user?.wallet_balance ?? 0;
    if (bal < minBal) {
      Alert.alert(
        "Add money",
        `You need at least ₹${minBal} for this chat (5 min at current rate). Your balance is ₹${bal}.`,
        [
          { text: "OK", style: "cancel" },
          { text: "Wallet", onPress: () => router.push("/(tabs)/wallet") },
        ]
      );
      return;
    }
    setChatLoading(true);
    try {
      const res = await api.post("/api/chat/request", {
        astrologer_id: astro.id,
      });
      const sessionId = res.data?.data?.session_id as string | undefined;
      if (!sessionId) {
        throw new Error("No session");
      }
      const name = encodeURIComponent(astro.user.name);
      router.push(`/chat/${sessionId}?name=${name}`);
    } catch (e: unknown) {
      const errData =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response
          ? (e.response.data as {
              error?: string;
              data?: { required?: number; balance?: number };
            })
          : undefined;
      if (errData?.data?.required != null) {
        Alert.alert(
          "Insufficient balance",
          `Required: ₹${errData.data.required}. Your balance: ₹${errData.data.balance ?? 0}.`
        );
      } else {
        const msg = errData?.error ?? "Could not start chat";
        Alert.alert("Chat", msg);
      }
    } finally {
      setChatLoading(false);
    }
  };

  if (loading || !id) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (!astro) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
          <Text style={styles.backTxt}>Back</Text>
        </Pressable>
        <Text style={styles.empty}>Astrologer not found.</Text>
      </SafeAreaView>
    );
  }

  const rating =
    astro.rating != null ? astro.rating.toFixed(1) : "—";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
          <Text style={styles.backTxt}>Back</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            {astro.user.avatar_url ? (
              <Image
                source={{ uri: astro.user.avatar_url }}
                style={styles.avatarImg}
              />
            ) : (
              <Text style={styles.avatarTxt}>
                {initials(astro.user.name)}
              </Text>
            )}
          </View>
          <Text style={styles.name}>{astro.user.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text style={styles.rating}>{rating}</Text>
            <Text style={styles.reviewCount}>
              ({astro.total_reviews} reviews)
            </Text>
            <View
              style={[
                styles.badge,
                astro.is_available ? styles.badgeOn : styles.badgeOff,
              ]}
            >
              <Text
                style={
                  astro.is_available ? styles.badgeTxtOn : styles.badgeTxtOff
                }
              >
                {astro.is_available ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
          <Text style={styles.price}>
            ₹{astro.price_per_minute ?? 0}/min
          </Text>
          {astro.experience_years != null ? (
            <Text style={styles.exp}>
              {astro.experience_years}+ years experience
            </Text>
          ) : null}
        </View>

        <Text style={styles.section}>Specializations</Text>
        <Text style={styles.body}>
          {astro.specializations.join(" · ") || "—"}
        </Text>

        <Text style={styles.section}>Languages</Text>
        <Text style={styles.body}>
          {astro.languages.join(" · ") || "—"}
        </Text>

        <Text style={styles.section}>About</Text>
        <Text style={styles.body}>{astro.bio || "No bio yet."}</Text>

        <Text style={styles.section}>Reviews</Text>
        <FlatList
          data={reviews}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.reviewEmpty}>No reviews yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewName}>{item.user_name}</Text>
              <Text style={styles.reviewRating}>★ {item.rating}</Text>
              {item.comment ? (
                <Text style={styles.reviewComment}>{item.comment}</Text>
              ) : null}
            </View>
          )}
        />
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.cta, chatLoading && styles.ctaDisabled]}
          disabled={chatLoading}
          onPress={() => void startChat()}
        >
          {chatLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.ctaTxt}>Start Chat</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    paddingHorizontal: 8,
  },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    alignSelf: "flex-start",
  },
  backTxt: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: "600",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6B7280",
    fontSize: 16,
  },
  scroll: {
    paddingHorizontal: 16,
  },
  hero: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: LIGHT,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  avatarImg: { width: 96, height: 96 },
  avatarTxt: {
    fontSize: 32,
    fontWeight: "800",
    color: PRIMARY,
  },
  name: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  rating: {
    fontSize: 16,
    fontWeight: "700",
    color: "#374151",
  },
  reviewCount: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 4,
  },
  badgeOn: { backgroundColor: "#D1FAE5" },
  badgeOff: { backgroundColor: "#F3F4F6" },
  badgeTxtOn: { color: "#047857", fontWeight: "700", fontSize: 12 },
  badgeTxtOff: { color: "#6B7280", fontWeight: "700", fontSize: 12 },
  price: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY,
  },
  exp: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  section: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 16,
    marginBottom: 6,
  },
  body: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
  },
  reviewEmpty: {
    color: "#9CA3AF",
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: LIGHT,
  },
  reviewName: {
    fontWeight: "700",
    color: "#111827",
  },
  reviewRating: {
    marginTop: 4,
    color: "#B45309",
    fontWeight: "600",
  },
  reviewComment: {
    marginTop: 8,
    color: "#374151",
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: LIGHT,
  },
  cta: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaDisabled: {
    opacity: 0.8,
  },
  ctaTxt: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
