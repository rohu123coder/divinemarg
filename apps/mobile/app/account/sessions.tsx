import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore } from "../../lib/store";

export default function SessionsScreen() {
  const router = useRouter();
  const sessions = useAppStore((state) => state.activeSessions);

  return (
    <SafeAreaView style={styles.safe}>
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A1A2E" }}>My Sessions</Text>
      </View>
      <Text style={styles.heading}>My Sessions</Text>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={<Text style={styles.empty}>No sessions yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.astrologer_photo ?? "https://i.pravatar.cc/100?img=55" }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.astrologer_name}</Text>
              <Text style={styles.meta}>{item.mode.toUpperCase()} · {item.date}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  heading: { margin: 16, fontSize: 22, color: "#1A1A2E", fontWeight: "800" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 12,
    marginBottom: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  name: { color: "#1A1A2E", fontWeight: "700" },
  meta: { marginTop: 4, color: "#6B7280", fontSize: 12 },
  empty: { color: "#6B7280", textAlign: "center", marginTop: 40 },
});
