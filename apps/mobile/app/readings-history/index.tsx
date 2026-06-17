import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getReadingHistory, type Reading, type ReadingType } from "../../lib/readings";

function readingTypeLabel(type: ReadingType): string {
  if (type === "palm") return "Palm Reading";
  if (type === "face") return "Face Reading";
  return "Hand & Face Reading";
}

function resultRoute(type: ReadingType): "/palm-reading/result" | "/face-reading/result" {
  return type === "face" ? "/face-reading/result" : "/palm-reading/result";
}

export default function ReadingsHistoryScreen() {
  const router = useRouter();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReadingHistory();
      setReadings(data);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        (e instanceof Error ? e.message : "Failed to load readings");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22 }}>‹</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>My Readings</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#EF4444" }}>{error}</Text>
        </View>
      ) : readings.length === 0 ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#6B7280" }}>No readings yet.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {readings.map((item) => (
            <Pressable
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: resultRoute(item.readingType),
                  params: { id: item.id },
                })
              }
              style={{
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: "#EDE9FE",
                borderRadius: 10,
                backgroundColor: "#FFFFFF",
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 15 }}>{readingTypeLabel(item.readingType)}</Text>
              <Text style={{ marginTop: 4, color: "#6B7280" }}>{item.category}</Text>
              <Text style={{ marginTop: 4, fontSize: 12, color: "#9CA3AF" }}>
                {new Date(item.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
