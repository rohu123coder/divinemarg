import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../lib/api";
import { useAppStore, type User } from "../../lib/store";

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const hydrateAuth = useAppStore((state) => state.hydrateAuth);

  const sendOtp = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", { phone });
      setRequested(true);
      Alert.alert("OTP sent", "Please check your phone.");
    } catch {
      Alert.alert("Error", "Could not send OTP right now.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", { phone, otp });
      const token = (res.data?.data?.token ?? "") as string;
      const payload = (res.data?.data?.user ?? {}) as Partial<User>;
      if (!token || !payload.id || !payload.name) throw new Error("Invalid response");
      hydrateAuth({
        user: {
          id: payload.id,
          name: payload.name,
          phone: payload.phone ?? phone,
          wallet_balance: payload.wallet_balance ?? 0,
          profile_photo: payload.profile_photo ?? null,
        },
        token,
      });
      router.replace("/(tabs)");
    } catch {
      Alert.alert("Error", "Invalid OTP.");
    } finally {
      setLoading(false);
    }
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A1A2E" }}>Login</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to DivineMarg</Text>
        <Text style={styles.subtitle}>Login with OTP</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
        />
        {requested ? (
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="Enter OTP"
            value={otp}
            onChangeText={setOtp}
          />
        ) : null}
        <Pressable
          style={[styles.button, loading && { opacity: 0.6 }]}
          onPress={requested ? verifyOtp : sendOtp}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {requested ? (loading ? "Verifying..." : "Verify OTP") : loading ? "Sending..." : "Send OTP"}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push("/auth/register")}>
          <Text style={styles.link}>New user? Create account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#1A1A2E" },
  subtitle: { marginTop: 8, color: "#6B7280", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  button: {
    marginTop: 6,
    backgroundColor: "#7C3AED",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
  link: { marginTop: 14, color: "#7C3AED", textAlign: "center", fontWeight: "600" },
});
