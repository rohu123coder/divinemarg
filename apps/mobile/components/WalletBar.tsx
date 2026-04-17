import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  balance: number;
  onPress: () => void;
};

export function WalletBar({ balance, onPress }: Props) {
  return (
    <Pressable style={styles.bar} onPress={onPress}>
      <View style={styles.left}>
        <Ionicons name="wallet" size={18} color="#7C3AED" />
        <Text style={styles.label}>Wallet</Text>
      </View>
      <Text style={styles.amount}>₹{balance.toFixed(0)}</Text>
      <Text style={styles.plus}>+</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 5 },
  label: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  amount: { color: "#1A1A2E", fontSize: 13, fontWeight: "700" },
  plus: { color: "#7C3AED", fontSize: 15, fontWeight: "700" },
});
