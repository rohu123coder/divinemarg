import { useRouter } from "expo-router";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { useAppStore } from "../../lib/store";

const packages = [
  { id: "p1", amount: 100, bonus: 0 },
  { id: "p2", amount: 300, bonus: 30 },
  { id: "p3", amount: 500, bonus: 70 },
  { id: "p4", amount: 1000, bonus: 200 },
];

const tx = [
  { id: "t1", label: "Recharge", amount: "+₹500", date: "Today" },
  { id: "t2", label: "Chat Session", amount: "-₹96", date: "Yesterday" },
  { id: "t3", label: "Call Session", amount: "-₹140", date: "2 days ago" },
];

export default function WalletScreen() {
  const router = useRouter();
  const balance = useAppStore((state) => state.user?.wallet_balance ?? 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balance}>₹{balance.toFixed(0)}</Text>
        <Pressable style={styles.addMoneyBtn} onPress={() => router.push("/wallet/recharge")}>
          <Text style={styles.addMoneyTxt}>Add Money</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Recharge Packages</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={packages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View style={styles.pkgCard}>
            <Text style={styles.pkgAmount}>₹{item.amount}</Text>
            <Text style={styles.pkgBonus}>+₹{item.bonus} bonus</Text>
          </View>
        )}
      />

      <Text style={styles.section}>Transaction History</Text>
      <FlatList
        data={tx}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.txItem}>
            <View>
              <Text style={styles.txTitle}>{item.label}</Text>
              <Text style={styles.txDate}>{item.date}</Text>
            </View>
            <Text style={styles.txAmount}>{item.amount}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  balanceCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: "#0F0A1E",
    padding: 16,
  },
  balanceLabel: { color: "#C4B5FD", fontSize: 13 },
  balance: { color: "#FFFFFF", fontSize: 34, fontWeight: "800", marginTop: 8 },
  addMoneyBtn: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#D4AF37",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addMoneyTxt: { color: "#1A1A2E", fontWeight: "700" },
  section: { marginHorizontal: 16, marginVertical: 10, fontWeight: "800", color: "#1A1A2E", fontSize: 17 },
  pkgCard: {
    width: 120,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 12,
  },
  pkgAmount: { fontSize: 22, color: "#7C3AED", fontWeight: "800" },
  pkgBonus: { marginTop: 5, color: "#6B7280", fontSize: 12 },
  txItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EDE9FE",
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  txTitle: { color: "#1A1A2E", fontWeight: "700" },
  txDate: { color: "#6B7280", marginTop: 3, fontSize: 12 },
  txAmount: { color: "#7C3AED", fontWeight: "700" },
});
