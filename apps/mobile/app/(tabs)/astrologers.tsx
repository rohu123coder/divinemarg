import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AstrologerCard } from "../../components/AstrologerCard";
import api from "../../lib/api";
import type { AstrologerListItem } from "../../lib/types";

const PRIMARY = "#7C3AED";
const LIGHT = "#EDE9FE";

type SortKey = "rating_desc" | "rating_asc" | "price_asc" | "price_desc";

const SORT_CHIPS: { key: SortKey; label: string }[] = [
  { key: "rating_desc", label: "Top rated" },
  { key: "rating_asc", label: "Rating ↑" },
  { key: "price_asc", label: "Price: low" },
  { key: "price_desc", label: "Price: high" },
];

export default function AstrologersTab() {
  const [sort, setSort] = useState<SortKey>("rating_desc");
  const [items, setItems] = useState<AstrologerListItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPage = useCallback(
    async (p: number, append: boolean) => {
      const res = await api.get("/api/astrologers", {
        params: { page: p, limit: 15, sort },
      });
      const data = res.data?.data as
        | {
            astrologers?: AstrologerListItem[];
            total?: number;
          }
        | undefined;
      const list = data?.astrologers ?? [];
      const t = data?.total ?? 0;
      setTotal(t);
      if (append) {
        setItems((prev) => [...prev, ...list]);
      } else {
        setItems(list);
      }
      setPage(p);
    },
    [sort]
  );

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await fetchPage(1, false);
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPage(1, false);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPage]);

  const onEnd = useCallback(async () => {
    if (loadingMore || loading) return;
    if (items.length >= total) return;
    setLoadingMore(true);
    try {
      await fetchPage(page + 1, true);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, items.length, loading, loadingMore, page, total]);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.title}>Astrologers</Text>
      <ScrollChips sort={sort} onChange={setSort} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AstrologerCard item={item} />}
          contentContainerStyle={styles.listPad}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReachedThreshold={0.35}
          onEndReached={onEnd}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={styles.footer} color={PRIMARY} />
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No astrologers found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

function ScrollChips({
  sort,
  onChange,
}: {
  sort: SortKey;
  onChange: (s: SortKey) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {SORT_CHIPS.map((c) => (
        <Pressable
          key={c.key}
          style={[styles.chip, sort === c.key && styles.chipOn]}
          onPress={() => onChange(c.key)}
        >
          <Text style={[styles.chipTxt, sort === c.key && styles.chipTxtOn]}>
            {c.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: LIGHT,
  },
  chipOn: {
    backgroundColor: LIGHT,
    borderColor: PRIMARY,
  },
  chipTxt: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  chipTxtOn: {
    color: PRIMARY,
  },
  listPad: {
    paddingBottom: 24,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    marginVertical: 16,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#6B7280",
  },
});
