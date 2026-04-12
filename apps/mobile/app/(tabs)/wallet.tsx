import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import type { WalletTransaction } from "../../lib/types";

const PRIMARY = "#7C3AED";
const LIGHT = "#EDE9FE";

const PRESETS = [99, 199, 499, 999];

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RazorpayCheckout = require("react-native-razorpay").default as {
  open: (opts: Record<string, unknown>) => Promise<{
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }>;
};

export default function WalletTab() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const user = useAuthStore((s) => s.user);
  const setUserPartial = useAuthStore((s) => s.setUserPartial);

  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const res = await api.get("/api/users/wallet");
      const data = res.data?.data as
        | { balance?: number; transactions?: WalletTransaction[] }
        | undefined;
      if (typeof data?.balance === "number") {
        setBalance(data.balance);
        setUserPartial({ wallet_balance: data.balance });
      }
      setTx(data?.transactions ?? []);
    } catch {
      setBalance(user?.wallet_balance ?? 0);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, setUserPartial, user?.wallet_balance]);

  useEffect(() => {
    void load();
  }, [load]);

  const pay = async (amount: number) => {
    if (!isLoggedIn) {
      return;
    }
    setPaying(true);
    try {
      const orderRes = await api.post("/api/wallet/create-order", {
        amount,
        currency: "INR",
      });
      const d = orderRes.data?.data as
        | {
            orderId?: string;
            amount?: number;
            currency?: string;
            keyId?: string;
          }
        | undefined;
      if (!d?.orderId || !d.keyId) {
        throw new Error("Could not create order");
      }

      const options: Record<string, unknown> = {
        description: "Wallet recharge",
        currency: d.currency ?? "INR",
        key: d.keyId,
        amount: String(d.amount),
        name: "DivineMarg",
        order_id: d.orderId,
        theme: { color: PRIMARY },
        prefill: {
          contact: user?.phone,
          email: user?.email ?? "",
          name: user?.name ?? "",
        },
      };

      const payment = await RazorpayCheckout.open(options);
      const verify = await api.post("/api/wallet/verify-payment", {
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      });
      const bal = verify.data?.data?.wallet_balance as number | undefined;
      if (typeof bal === "number") {
        setBalance(bal);
        setUserPartial({ wallet_balance: bal });
      }
      await load();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "description" in e &&
        typeof (e as { description?: unknown }).description === "string"
          ? (e as { description: string }).description
          : e &&
              typeof e === "object" &&
              "response" in e &&
              e.response &&
              typeof e.response === "object" &&
              "data" in e.response &&
              e.response.data &&
              typeof e.response.data === "object" &&
              "error" in e.response.data
            ? String((e.response.data as { error?: string }).error)
            : typeof e === "object" &&
                e !== null &&
                "message" in e &&
                typeof (e as { message?: unknown }).message === "string"
              ? (e as { message: string }).message
              : "Payment cancelled or failed";
      if (msg && msg !== "undefined") {
        Alert.alert("Payment", msg);
      }
    } finally {
      setPaying(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Text style={styles.title}>Wallet</Text>
        <View style={styles.prompt}>
          <Text style={styles.promptTitle}>Log in to use your wallet</Text>
          <Text style={styles.promptTxt}>
            Recharge and pay per minute for live chats with astrologers.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Text style={styles.title}>Wallet</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available balance</Text>
        {loading ? (
          <ActivityIndicator color={PRIMARY} />
        ) : (
          <Text style={styles.balanceAmt}>₹{balance.toFixed(0)}</Text>
        )}
      </View>

      <Text style={styles.section}>Quick recharge</Text>
      <View style={styles.presetRow}>
        {PRESETS.map((a) => (
          <Pressable
            key={a}
            style={[styles.preset, paying && styles.presetDisabled]}
            disabled={paying}
            onPress={() => void pay(a)}
          >
            <Text style={styles.presetTxt}>₹{a}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>Transactions</Text>
      <FlatList
        data={tx}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions yet.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View>
              <Text style={styles.txType}>{item.type}</Text>
              <Text style={styles.txDate}>
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </View>
            <Text
              style={[
                styles.txAmt,
                item.type === "recharge" ? styles.txPos : styles.txNeg,
              ]}
            >
              {item.type === "recharge" ? "+" : "−"}₹{Number(item.amount).toFixed(0)}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.txList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  prompt: {
    marginHorizontal: 16,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: LIGHT,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  promptTxt: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 22,
  },
  balanceCard: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 20,
    backgroundColor: LIGHT,
    borderWidth: 1,
    borderColor: PRIMARY,
    alignItems: "center",
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  balanceAmt: {
    fontSize: 36,
    fontWeight: "800",
    color: PRIMARY,
  },
  section: {
    fontSize: 16,
    fontWeight: "800",
    color: "#374151",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  preset: {
    flexGrow: 1,
    minWidth: "22%",
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  presetDisabled: {
    opacity: 0.6,
  },
  presetTxt: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  txList: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: LIGHT,
  },
  txType: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    textTransform: "capitalize",
  },
  txDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  txAmt: {
    fontSize: 16,
    fontWeight: "800",
  },
  txPos: { color: "#047857" },
  txNeg: { color: "#B45309" },
  empty: {
    textAlign: "center",
    color: "#9CA3AF",
    marginTop: 24,
  },
});
