import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

import api from "../../lib/api";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const register = async () => {
    try {
      await api.post("/api/auth/send-otp", { phone, name });
      Alert.alert("Success", "Account created. Please verify OTP on login.");
      router.replace("/auth/login");
    } catch {
      Alert.alert("Error", "Could not create account.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Create your account</Text>
        <TextInput style={styles.input} placeholder="Full name" value={name} onChangeText={setName} />
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
        />
        <Pressable style={styles.button} onPress={register}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  container: { flex: 1, justifyContent: "center", padding: 20 },
  title: { fontSize: 26, color: "#1A1A2E", fontWeight: "800", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    backgroundColor: "#D4AF37",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 13,
  },
  buttonText: { color: "#1A1A2E", fontWeight: "700" },
});
