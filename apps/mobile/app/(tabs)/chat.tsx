import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { AstrologerCard } from "../../components/AstrologerCard";
import { useAppStore } from "../../lib/store";

const filters = ["All", "Favourite", "NEW!"] as const;

export default function ChatListTab() {
  const astrologers = useAppStore((state) => state.astrologers);
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>("All");

  const filtered = useMemo(() => {
    if (selectedFilter === "All") return astrologers;
    if (selectedFilter === "NEW!") return astrologers.filter((_, index) => index % 2 === 0);
    return astrologers.slice(0, 4);
  }, [astrologers, selectedFilter]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Recharge and get 50% cashback</Text>
        <Text style={styles.bannerSub}>Limited offer for DivineMarg users</Text>
      </View>

      <View style={styles.filters}>
        {filters.map((filter) => {
          const selected = selectedFilter === filter;
          return (
            <Pressable
              key={filter}
              style={[styles.pill, selected && styles.pillSelected]}
              onPress={() => setSelectedFilter(filter)}
            >
              {filter === "Favourite" ? (
                <Ionicons name="star" size={14} color={selected ? "#7C3AED" : "#6B7280"} />
              ) : null}
              <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{filter}</Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AstrologerCard item={item} mode="chat" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No astrologers available.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  banner: {
    margin: 16,
    marginBottom: 10,
    backgroundColor: "#0F0A1E",
    borderRadius: 14,
    padding: 14,
  },
  bannerTitle: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  bannerSub: { color: "#C4B5FD", marginTop: 4, fontSize: 12 },
  filters: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginBottom: 10 },
  pill: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
  },
  pillSelected: {
    borderColor: "#D4AF37",
    backgroundColor: "#FDF6DD",
  },
  pillText: { color: "#6B7280", fontWeight: "600", fontSize: 12 },
  pillTextSelected: { color: "#7C3AED", fontWeight: "700" },
  list: { paddingHorizontal: 16, paddingBottom: 18 },
  empty: { textAlign: "center", marginTop: 40, color: "#6B7280" },
});
