import { useRouter } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { AstrologerCard } from "../../components/AstrologerCard";
import { useAppStore } from "../../lib/store";

export default function CallListTab() {
  const router = useRouter();
  const astrologers = useAppStore((state) => state.astrologers);

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={astrologers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AstrologerCard item={item} mode="call" />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.title}>Call Astrologers</Text>
        }
      />
      <View style={styles.floatCard}>
        <Text style={styles.floatText}>Not sure whom to connect?</Text>
        <Pressable style={styles.floatButton} onPress={() => router.push("/(tabs)/live")}>
          <Text style={styles.floatButtonText}>Call Now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  title: { marginVertical: 12, fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
  floatCard: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  floatText: { color: "#6B7280", fontWeight: "600" },
  floatButton: {
    backgroundColor: "#D4AF37",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  floatButtonText: { color: "#1A1A2E", fontWeight: "700" },
});
