import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getReadingById, type Reading } from "../../lib/readings";

export default function FaceReadingResultScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reading, setReading] = useState<Reading | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== "string") {
      setError("Missing reading id");
      setLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await getReadingById(id);
        setReading(data);
      } catch (e: unknown) {
        const msg =
          (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
          (e instanceof Error ? e.message : "Failed to load reading");
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <View style={{ padding: 16, flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22 }}>‹</Text>
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "700" }}>Your Face Reading</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "#EF4444" }}>{error}</Text>
        </View>
      ) : reading ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 16 }}>
            {reading.category}
          </Text>

          <Text style={{ fontWeight: "700", marginTop: 12 }}>Overview</Text>
          <Text style={{ marginTop: 4, lineHeight: 22 }}>{reading.overview}</Text>

          <Text style={{ fontWeight: "700", marginTop: 20 }}>Samagri</Text>
          <Text style={{ marginTop: 4, lineHeight: 22 }}>{reading.samagri}</Text>

          <Text style={{ fontWeight: "700", marginTop: 20 }}>Vidhi</Text>
          <Text style={{ marginTop: 4, lineHeight: 22 }}>{reading.vidhi}</Text>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}
