import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { WalletBar } from "../../components/WalletBar";
import api from "../../lib/api";
import { useAppStore, type ActiveSession, type Astrologer } from "../../lib/store";

const COLORS = {
  primary: "#7C3AED",
  gold: "#D4AF37",
  background: "#FAFAFA",
  dark: "#0F0A1E",
  text: "#1A1A2E",
  secondary: "#6B7280",
  online: "#10B981",
};

const QUICK_ACTIONS = [
  { key: "daily", label: "Daily Horoscope", icon: "sunny-outline" as const },
  { key: "kundli", label: "Free Kundli", icon: "pie-chart-outline" as const },
  { key: "matching", label: "Kundli Matching", icon: "ring" as const },
  { key: "blog", label: "Astrology Blog", icon: "book-outline" as const },
];

const sampleSessions: ActiveSession[] = [
  {
    id: "s1",
    astrologer_id: "1",
    astrologer_name: "Acharya Rohan",
    astrologer_photo: "https://i.pravatar.cc/120?img=12",
    mode: "chat",
    date: "Today, 10:30 PM",
  },
  {
    id: "s2",
    astrologer_id: "2",
    astrologer_name: "Priya Sharma",
    astrologer_photo: "https://i.pravatar.cc/120?img=23",
    mode: "call",
    date: "Yesterday, 8:10 PM",
  },
];

export default function HomeTab() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const user = useAppStore((state) => state.user);
  const astrologers = useAppStore((state) => state.astrologers);
  const activeSessions = useAppStore((state) =>
    state.activeSessions.length ? state.activeSessions : sampleSessions
  );
  const setAstrologers = useAppStore((state) => state.setAstrologers);
  const setActiveSessions = useAppStore((state) => state.setActiveSessions);

  const fetchList = useCallback(async () => {
    try {
      const res = await api.get("/api/astrologers");
      const list = (res.data?.data?.astrologers ?? []) as Array<{
        id: string;
        name: string;
        avatar_url?: string | null;
        profile_photo?: string | null;
        specialization?: string;
        specializations?: string[];
        languages?: string[];
        experience_years?: number;
        rating?: number;
        total_orders?: number;
        price_per_min?: number;
        price_per_minute?: number;
        is_available?: boolean;
      }>;
      const mapped: Astrologer[] = list.map((item, index) => ({
        id: item.id,
        name: item.name,
        profile_photo: item.profile_photo ?? item.avatar_url ?? null,
        specialization: item.specialization ?? item.specializations?.[0] ?? "Vedic Astrology",
        languages: item.languages?.length ? item.languages : ["Hindi", "English"],
        experience_years: item.experience_years ?? 5 + (index % 8),
        rating: item.rating ?? 4.7,
        orders: item.total_orders ?? 200 + index * 20,
        price_per_min: item.price_per_min ?? item.price_per_minute ?? 20 + index,
        status: item.is_available ? "online" : index % 3 === 0 ? "busy" : "offline",
        wait_time_minutes: 3 + (index % 6),
      }));
      setAstrologers(mapped);
      if (!activeSessions.length) setActiveSessions(sampleSessions);
    } catch {
      if (!astrologers.length) {
        setAstrologers([
          {
            id: "1",
            name: "Acharya Rohan",
            profile_photo: "https://i.pravatar.cc/120?img=12",
            specialization: "Love, Marriage, Career",
            languages: ["Hindi", "English"],
            experience_years: 11,
            rating: 4.9,
            orders: 1320,
            price_per_min: 34,
            status: "online",
          },
          {
            id: "2",
            name: "Priya Sharma",
            profile_photo: "https://i.pravatar.cc/120?img=23",
            specialization: "Tarot, Numerology",
            languages: ["Hindi", "English", "Gujarati"],
            experience_years: 7,
            rating: 4.8,
            orders: 860,
            price_per_min: 28,
            status: "busy",
            wait_time_minutes: 4,
          },
        ]);
      }
      if (!activeSessions.length) setActiveSessions(sampleSessions);
    }
  }, [activeSessions.length, astrologers.length, setActiveSessions, setAstrologers]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return astrologers;
    return astrologers.filter((a) => a.name.toLowerCase().includes(q));
  }, [astrologers, search]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLabel}>{(user?.name ?? "D").slice(0, 1).toUpperCase()}</Text>
            </View>
            <Ionicons name="menu" size={22} color={COLORS.text} />
          </View>
          <Text style={styles.logo}>DivineMarg</Text>
          <View style={styles.headerRight}>
            <WalletBar balance={user?.wallet_balance ?? 0} onPress={() => router.push("/wallet")} />
            <Ionicons name="notifications-outline" size={22} color={COLORS.text} />
          </View>
        </View>

        <Pressable style={styles.searchWrap} onPress={() => router.push("/(tabs)/chat")}>
          <Ionicons name="search" size={18} color={COLORS.secondary} />
          <TextInput
            style={styles.search}
            placeholder="Search astrologers..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </Pressable>

        <View style={styles.quickRow}>
          {QUICK_ACTIONS.map((item) => (
            <Pressable key={item.key} style={styles.quickItem}>
              <View style={styles.quickCircle}>
                {item.icon === "ring" ? (
                  <MaterialCommunityIcons name="ring" size={22} color="#FFFFFF" />
                ) : (
                  <Ionicons name={item.icon} size={22} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerTitle}>First Consultation FREE!</Text>
            <Text style={styles.bannerSub}>50% Cashback on Recharge</Text>
            <Pressable style={styles.rechargeBtn} onPress={() => router.push("/wallet/recharge")}>
              <Text style={styles.rechargeTxt}>Recharge Now</Text>
            </Pressable>
          </View>
          <Text style={styles.bannerIcon}>💰</Text>
        </View>

        <SectionTitle title="Live Astrologers" action="View All" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {filtered.slice(0, 8).map((astro) => (
            <Pressable key={astro.id} style={styles.liveCard} onPress={() => router.push(`/astrologer/${astro.id}`)}>
              <Image source={{ uri: astro.profile_photo ?? "https://i.pravatar.cc/200?img=40" }} style={styles.liveImg} />
              {astro.status === "online" ? <View style={styles.liveDot} /> : null}
              <Text style={styles.liveName}>{astro.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <SectionTitle title="My Sessions" action="View All" onPress={() => router.push("/account/sessions")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {activeSessions.map((item) => (
            <View key={item.id} style={styles.sessionCard}>
              <Image source={{ uri: item.astrologer_photo ?? "https://i.pravatar.cc/100?img=44" }} style={styles.sessionAvatar} />
              <Text style={styles.sessionName}>{item.astrologer_name}</Text>
              <Text style={styles.sessionDate}>{item.date}</Text>
              <View style={styles.sessionActions}>
                <Pressable style={styles.outlineBtn}>
                  <Text style={styles.outlineTxt}>View Chat</Text>
                </Pressable>
                <Pressable style={styles.fillBtn}>
                  <Text style={styles.fillTxt}>Chat Again</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>

        <SectionTitle title="Top Astrologers" action="View All" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hList}>
          {filtered.map((item) => (
            <View key={item.id} style={styles.topCard}>
              <View style={styles.topAvatarWrap}>
                <Image source={{ uri: item.profile_photo ?? "https://i.pravatar.cc/120?img=49" }} style={styles.topAvatar} />
              </View>
              <Text style={styles.topName}>{item.name}</Text>
              <Text style={styles.topPrice}>₹{item.price_per_min}/min</Text>
              <Pressable style={styles.topBtn} onPress={() => router.push(`/astrologer/${item.id}`)}>
                <Text style={styles.topBtnTxt}>Chat</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <View style={styles.badgesRow}>
          <Badge icon="lock-closed-outline" label="Private & Confidential" />
          <Badge icon="shield-checkmark-outline" label="Verified Astrologers" />
          <Badge icon="card-outline" label="Secure Payments" />
        </View>
        <View style={{ height: 96 }} />
      </ScrollView>

      <View style={styles.stickyBar}>
        <Pressable style={[styles.stickyBtn, styles.stickyChat]}>
          <Text style={styles.stickyTxt}>💬 Chat with Astrologer</Text>
        </Pressable>
        <Pressable style={[styles.stickyBtn, styles.stickyCall]}>
          <Text style={styles.stickyTxt}>📞 Call with Astrologer</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
  action,
  onPress,
}: {
  title: string;
  action: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{title}</Text>
      <Pressable onPress={onPress}>
        <Text style={styles.sectionAction}>{action}</Text>
      </Pressable>
    </View>
  );
}

function Badge({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={18} color={COLORS.primary} />
      <Text style={styles.badgeTxt}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 2,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: { fontSize: 16, fontWeight: "700", color: COLORS.primary },
  logo: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.gold,
  },
  searchWrap: {
    marginHorizontal: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  search: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    color: COLORS.text,
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  quickItem: {
    alignItems: "center",
  },
  quickCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    marginTop: 6,
    width: 72,
    fontSize: 11,
    textAlign: "center",
    color: COLORS.secondary,
    fontWeight: "600",
  },
  banner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: COLORS.dark,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  bannerSub: { color: "#C4B5FD", fontSize: 13, marginTop: 6 },
  rechargeBtn: {
    marginTop: 10,
    backgroundColor: COLORS.gold,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  rechargeTxt: { color: "#0F0A1E", fontWeight: "700", fontSize: 12 },
  bannerIcon: { fontSize: 32 },
  sectionRow: {
    marginHorizontal: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  sectionAction: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
  },
  hList: { paddingHorizontal: 16, gap: 10, marginBottom: 14 },
  liveCard: { width: 120, height: 160, borderRadius: 12, overflow: "hidden" },
  liveImg: { width: "100%", height: "100%" },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.online,
    position: "absolute",
    top: 8,
    right: 8,
    borderWidth: 1,
    borderColor: "#fff",
  },
  liveName: {
    position: "absolute",
    bottom: 6,
    left: 6,
    right: 6,
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  sessionCard: {
    width: 180,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 12,
  },
  sessionAvatar: { width: 42, height: 42, borderRadius: 21, marginBottom: 8 },
  sessionName: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  sessionDate: { marginTop: 4, fontSize: 12, color: COLORS.secondary },
  sessionActions: { marginTop: 10, flexDirection: "row", gap: 6 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  outlineTxt: { color: COLORS.primary, fontSize: 11, fontWeight: "700" },
  fillBtn: {
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  fillTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  topCard: {
    width: 150,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 12,
    alignItems: "center",
  },
  topAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: COLORS.gold,
    padding: 2,
    marginBottom: 8,
  },
  topAvatar: { width: "100%", height: "100%", borderRadius: 32 },
  topName: { fontSize: 13, fontWeight: "700", color: COLORS.text, textAlign: "center" },
  topPrice: { fontSize: 12, color: COLORS.secondary, marginTop: 4 },
  topBtn: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  topBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  badgesRow: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 12,
    gap: 10,
  },
  badge: { flexDirection: "row", alignItems: "center", gap: 8 },
  badgeTxt: { color: COLORS.secondary, fontSize: 13, fontWeight: "600" },
  stickyBar: {
    position: "absolute",
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 10,
  },
  stickyBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  stickyChat: { backgroundColor: COLORS.primary },
  stickyCall: { backgroundColor: COLORS.gold },
  stickyTxt: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "700",
    fontSize: 12,
  },
});
