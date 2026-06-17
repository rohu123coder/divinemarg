import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../lib/api";
import { PROBLEM_AREAS } from "../../lib/problemAreas";

export default function ProblemAreaScreen() {
  const router = useRouter();
  const { astrologerId, astrologerName } = useLocalSearchParams<{
    astrologerId: string;
    astrologerName?: string;
  }>();
  const displayName =
    typeof astrologerName === "string"
      ? decodeURIComponent(astrologerName)
      : "Astrologer";

  const [selected, setSelected] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  const toggleSelection = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  async function handleStart() {
    if (selected.length === 0 || !astrologerId) {
      Alert.alert("Required", "Please select at least one problem area");
      return;
    }

    try {
      setStarting(true);
      const res = await api.post("/api/chat/request", {
        astrologer_id: astrologerId,
        problem_area: selected,
      });
      const sessionId =
        res.data?.data?.session_id ?? res.data?.data?.sessionId ?? res.data?.sessionId;
      if (!sessionId) {
        throw new Error("Could not start chat");
      }
      router.replace({
        pathname: `/chat/${sessionId}`,
        params: {
          name: displayName,
          photo: "",
        },
      });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? (e instanceof Error ? e.message : "Failed");
      Alert.alert("Error", msg);
    } finally {
      setStarting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>What&apos;s on your mind?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sub}>
          Aaj kaunsa topic discuss karna hai {displayName} ji ke saath?
        </Text>
        <Text style={styles.hint}>Select one or more areas</Text>

        {PROBLEM_AREAS.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => toggleSelection(p.value)}
            style={[styles.card, selected.includes(p.value) && styles.cardOn]}
          >
            <Text style={styles.emoji}>{p.emoji}</Text>
            <Text
              style={[styles.cardLabel, selected.includes(p.value) && styles.cardLabelOn]}
            >
              {p.label}
            </Text>
            {selected.includes(p.value) ? <Text style={styles.check}>✓</Text> : null}
          </Pressable>
        ))}

        <Pressable
          onPress={() => void handleStart()}
          disabled={selected.length === 0 || starting}
          style={[
            styles.startBtn,
            (selected.length === 0 || starting) && styles.startBtnDisabled,
          ]}
        >
          {starting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.startTxt}>Start Chat 💬</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FF6B35",
    flexDirection: "row",
    alignItems: "center",
  },
  back: { color: "#fff", fontSize: 28, marginRight: 8 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  sub: { fontSize: 14, color: "#666", marginBottom: 8 },
  hint: { fontSize: 13, color: "#999", marginBottom: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 2,
    borderColor: "#eee",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
  },
  cardOn: {
    borderColor: "#FF6B35",
    backgroundColor: "#FFF4EF",
  },
  emoji: { fontSize: 26, marginRight: 12 },
  cardLabel: { fontSize: 16, color: "#333", flex: 1 },
  cardLabelOn: { fontWeight: "700", color: "#FF6B35" },
  check: { color: "#FF6B35", fontSize: 20, fontWeight: "700" },
  startBtn: {
    backgroundColor: "#FF6B35",
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
  },
  startBtnDisabled: { backgroundColor: "#ccc" },
  startTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
