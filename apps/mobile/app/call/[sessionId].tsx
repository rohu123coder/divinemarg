import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ActiveCallScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.connectedTxt}>Voice Call</Text>
        <Text style={styles.nameTxt}>Feature available in production build</Text>
      </View>
      <View style={styles.avatarWrap}>
        <Text style={styles.avatarInitial}>📞</Text>
      </View>
      <Pressable style={styles.endCallBtn} onPress={() => router.back()}>
        <Ionicons name="call" size={24} color="#FFFFFF" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0A1E", alignItems: "center", justifyContent: "space-between", paddingVertical: 48 },
  header: { alignItems: "center", gap: 8 },
  connectedTxt: { color: "#D4AF37", fontSize: 18, fontWeight: "700" },
  nameTxt: { color: "#E5E7EB", fontSize: 14, textAlign: "center", paddingHorizontal: 20 },
  avatarWrap: { width: 160, height: 160, borderRadius: 80, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 60 },
  endCallBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", transform: [{ rotate: "135deg" }] },
});
