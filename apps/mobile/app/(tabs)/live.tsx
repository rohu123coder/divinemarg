import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { useAppStore } from "../../lib/store";

export default function LiveTab() {
  const router = useRouter();
  const astrologers = useAppStore((state) => state.astrologers.filter((a) => a.status !== "offline"));

  return (
    <SafeAreaView style={styles.safe}>
      <Text style={styles.heading}>Live Astrologers</Text>
      <FlatList
        data={astrologers}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 10 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/astrologer/${item.id}`)}>
            <Image source={{ uri: item.profile_photo ?? "https://i.pravatar.cc/120?img=30" }} style={styles.image} />
            <View style={styles.liveBadge}>
              <Ionicons name="radio" size={12} color="#10B981" />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text style={styles.name}>{item.name}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  heading: { margin: 16, fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 10,
  },
  image: { width: "100%", aspectRatio: 1, borderRadius: 10, marginBottom: 8 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveText: { color: "#10B981", fontSize: 11, fontWeight: "700" },
  name: { marginTop: 6, color: "#1A1A2E", fontWeight: "700" },
});
