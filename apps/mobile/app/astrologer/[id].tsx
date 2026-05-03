import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import { useAppStore } from "../../lib/store";

const reviews = [
  { id: "1", name: "Anjali", rating: 5, date: "2d ago", text: "Very accurate guidance and calm advice." },
  { id: "2", name: "Rahul", rating: 4, date: "4d ago", text: "Helpful career reading, recommended." },
  { id: "3", name: "Pooja", rating: 5, date: "1w ago", text: "Excellent experience, clear remedies." },
];

export default function AstrologerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const astrologers = useAppStore((state) => state.astrologers);
  const astro = useMemo(() => astrologers.find((a) => a.id === id) ?? astrologers[0], [astrologers, id]);

  const [startingChat, setStartingChat] = useState(false);
  const [startingCall, setStartingCall] = useState(false);

  const handleStartChat = async () => {
    if (!astro) return;
    if (startingChat) return;
    setStartingChat(true);
    try {
      const res = await api.post("/api/chat/request", {
        astrologer_id: astro.id,
      });
      const sessionId = res.data?.data?.session_id ?? res.data?.data?.sessionId ?? res.data?.sessionId;
      if (!sessionId) {
        Alert.alert("Error", "Could not start chat. Please try again.");
        return;
      }
      router.push({
        pathname: `/chat/${sessionId}`,
        params: {
          name: astro.name,
          photo: astro.profile_photo ?? "",
        },
      });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Could not start chat";
      Alert.alert("Error", msg);
    } finally {
      setStartingChat(false);
    }
  };

  const handleStartCall = async () => {
    if (!astro) return;
    if (startingCall) return;
    setStartingCall(true);
    try {
      const res = await api.post("/api/chat/request", {
        astrologer_id: astro.id,
        session_type: "voice",
      });
      const sessionId = res.data?.data?.session_id ?? res.data?.data?.sessionId ?? res.data?.sessionId;
      if (!sessionId) {
        Alert.alert("Error", "Could not start call. Please try again.");
        return;
      }
      router.push({
        pathname: `/call/${sessionId}`,
        params: { callType: "voice" },
      });
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Could not start call";
      Alert.alert("Error", msg);
    } finally {
      setStartingCall(false);
    }
  };

  if (!astro) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.empty}>Astrologer not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderColor: "#E5E7EB",
          }}
        >
          <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={22} color="#1A1A2E" />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A1A2E" }}>Astrologer Profile</Text>
        </View>

        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: astro.profile_photo ?? "https://i.pravatar.cc/220?img=45" }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{astro.name}</Text>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={15} color="#10B981" />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
          <Text style={styles.meta}>{astro.specialization} | {astro.languages.join(", ")}</Text>
          <Text style={styles.meta}>Experience: {astro.experience_years} years</Text>
          <Text style={styles.price}>₹{astro.price_per_min}/min</Text>
          <Text style={styles.minutes}>💬 {astro.orders}K mins | 📞 {Math.max(1, Math.floor(astro.orders / 2))}K mins</Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.chatBtn} onPress={handleStartChat} disabled={startingChat}>
            {startingChat ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.chatBtnTxt}>Start Chat</Text>
            )}
          </Pressable>
          <Pressable style={styles.callBtn} onPress={handleStartCall} disabled={startingCall}>
            {startingCall ? (
              <ActivityIndicator color="#7C3AED" size="small" />
            ) : (
              <Text style={styles.callBtnTxt}>Start Call</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.section}>About Me</Text>
        <Text style={styles.body}>I provide practical and spiritual astrology guidance focused on clarity in relationships, career, and finances.</Text>

        <Text style={styles.section}>Rating</Text>
        <View style={styles.ratingBox}>
          <Text style={styles.ratingMain}>{astro.rating.toFixed(1)}</Text>
          <Text style={styles.stars}>★★★★★</Text>
          <Text style={styles.total}>2,431 reviews</Text>
          {[5, 4, 3, 2, 1].map((star) => (
            <View key={star} style={styles.ratingRow}>
              <Text style={styles.starLabel}>{star}★</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${star === 5 ? 78 : star === 4 ? 18 : 4}%` }]} />
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Reviews</Text>
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewName}>{item.name}</Text>
              <Text style={styles.reviewMeta}>{"★".repeat(item.rating)} · {item.date}</Text>
              <Text style={styles.reviewText}>{item.text}</Text>
            </View>
          )}
          ListFooterComponent={
            <Pressable style={styles.loadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </Pressable>
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  empty: { marginTop: 40, textAlign: "center", color: "#6B7280" },
  hero: { alignItems: "center", paddingHorizontal: 16, marginBottom: 12 },
  avatarWrap: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#D4AF37",
    padding: 3,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 100 },
  name: { marginTop: 12, fontSize: 24, fontWeight: "800", color: "#1A1A2E" },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  badgeText: { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  meta: { marginTop: 6, color: "#6B7280", textAlign: "center" },
  price: { marginTop: 8, color: "#7C3AED", fontWeight: "800", fontSize: 22 },
  minutes: { marginTop: 6, color: "#1A1A2E", fontWeight: "600" },
  actions: { paddingHorizontal: 16, gap: 10, marginBottom: 6 },
  chatBtn: { backgroundColor: "#10B981", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  chatBtnTxt: { color: "#FFFFFF", fontWeight: "700" },
  callBtn: { borderWidth: 1.5, borderColor: "#7C3AED", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  callBtnTxt: { color: "#7C3AED", fontWeight: "700" },
  section: { marginHorizontal: 16, marginTop: 14, marginBottom: 8, color: "#1A1A2E", fontWeight: "800", fontSize: 17 },
  body: { marginHorizontal: 16, color: "#6B7280", lineHeight: 21 },
  ratingBox: {
    marginHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  ratingMain: { fontSize: 34, color: "#1A1A2E", fontWeight: "800" },
  stars: { marginTop: 2, color: "#D4AF37", letterSpacing: 1 },
  total: { color: "#6B7280", marginTop: 4, marginBottom: 8 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  starLabel: { width: 24, color: "#6B7280", fontSize: 12 },
  barTrack: { flex: 1, height: 7, borderRadius: 5, backgroundColor: "#F3F4F6", overflow: "hidden" },
  barFill: { height: 7, borderRadius: 5, backgroundColor: "#7C3AED" },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 12,
  },
  reviewName: { color: "#1A1A2E", fontWeight: "700" },
  reviewMeta: { marginTop: 4, color: "#D4AF37", fontSize: 12 },
  reviewText: { marginTop: 6, color: "#6B7280" },
  loadMore: { marginTop: 8, alignSelf: "center" },
  loadMoreText: { color: "#7C3AED", fontWeight: "700" },
});
