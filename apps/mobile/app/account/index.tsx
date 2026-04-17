import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { useAppStore } from "../../lib/store";

export default function AccountScreen() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.name}>{user?.name ?? "Guest User"}</Text>
        <Text style={styles.phone}>{user?.phone ?? "-"}</Text>
      </View>
      <Pressable style={styles.row} onPress={() => router.push("/account/sessions")}>
        <Text style={styles.rowText}>My Sessions</Text>
      </Pressable>
      <Pressable style={styles.row} onPress={() => router.push("/wallet")}>
        <Text style={styles.rowText}>Wallet</Text>
      </Pressable>
      <Pressable
        style={styles.logout}
        onPress={() => {
          logout();
          router.replace("/auth/login");
        }}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA", padding: 16 },
  card: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 16,
    marginBottom: 16,
  },
  name: { fontSize: 20, fontWeight: "800", color: "#1A1A2E" },
  phone: { marginTop: 4, color: "#6B7280" },
  row: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 14,
    marginBottom: 10,
  },
  rowText: { color: "#1A1A2E", fontWeight: "700" },
  logout: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#EF4444",
    alignItems: "center",
    paddingVertical: 13,
  },
  logoutText: { color: "#FFFFFF", fontWeight: "700" },
});
