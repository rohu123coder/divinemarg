import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AstrologerCard } from "../../components/AstrologerCard";
import api from "../../lib/api";
import type { AstrologerListItem } from "../../lib/types";

const PRIMARY = "#7C3AED";
const LIGHT = "#EDE9FE";

const CATEGORIES = [
  "All",
  "Love",
  "Career",
  "Finance",
  "Vastu",
  "Numerology",
  "Tarot",
] as const;

export default function HomeTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [items, setItems] = useState<AstrologerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = useCallback(async () => {
    const params: Record<string, string | number> = { limit: 10, page: 1 };
    if (category !== "All") {
      params.specialization = category;
    }
    const res = await api.get("/api/astrologers", { params });
    const list = res.data?.data?.astrologers as AstrologerListItem[] | undefined;
    setItems(list ?? []);
  }, [category]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await fetchList();
    } finally {
      setLoading(false);
    }
  }, [fetchList]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchList();
    } finally {
      setRefreshing(false);
    }
  }, [fetchList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((a) => a.name.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.brand}>DivineMarg</Text>
        <TextInput
          style={styles.search}
          placeholder="Search astrologers…"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScroll}
        style={styles.pillsWrap}
      >
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={[styles.pill, category === c && styles.pillActive]}
            onPress={() => setCategory(c)}
          >
            <Text
              style={[styles.pillTxt, category === c && styles.pillTxtActive]}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={styles.section}>Featured Astrologers</Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AstrologerCard item={item} />}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No astrologers found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 12,
  },
  search: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: LIGHT,
  },
  pillsWrap: {
    maxHeight: 48,
    marginBottom: 8,
  },
  pillsScroll: {
    flexDirection: "row",
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: LIGHT,
  },
  pillActive: {
    backgroundColor: LIGHT,
    borderColor: PRIMARY,
  },
  pillTxt: {
    color: "#4B5563",
    fontWeight: "600",
    fontSize: 14,
  },
  pillTxtActive: {
    color: PRIMARY,
  },
  section: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  listPad: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6B7280",
    fontSize: 15,
  },
});
