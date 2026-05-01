import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppStore } from "../../lib/store";

const options = [100, 300, 500, 1000];

export default function RechargeScreen() {
  const router = useRouter();
  const setWalletBalance = useAppStore((state) => state.setWalletBalance);
  const current = useAppStore((state) => state.user?.wallet_balance ?? 0);

  const addMoney = (amount: number) => {
    setWalletBalance(current + amount);
    router.replace("/wallet");
  };

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
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A1A2E" }}>Recharge Wallet</Text>
      </View>
      <Text style={styles.heading}>Recharge Wallet</Text>
      <View style={styles.optionsWrap}>
        {options.map((option) => (
          <Pressable key={option} style={styles.option} onPress={() => addMoney(option)}>
            <Text style={styles.amount}>₹{option}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA", padding: 16 },
  heading: { fontSize: 24, color: "#1A1A2E", fontWeight: "800", marginBottom: 16 },
  optionsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  option: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    backgroundColor: "#FFFFFF",
    paddingVertical: 20,
    alignItems: "center",
  },
  amount: { color: "#7C3AED", fontWeight: "800", fontSize: 22 },
});
