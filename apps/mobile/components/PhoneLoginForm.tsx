import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import api from "../lib/api";
import { useAuthStore, type AuthUser } from "../lib/store";

const PRIMARY = "#7C3AED";
const LIGHT = "#EDE9FE";

type Props = {
  onLoggedIn?: () => void;
};

export function PhoneLoginForm({ onLoggedIn }: Props) {
  const setUser = useAuthStore((s) => s.setUser);
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/auth/send-otp", { phone });
      setStep("otp");
      setOtp(["", "", "", "", "", ""]);
      requestAnimationFrame(() => otpRefs.current[0]?.focus());
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "error" in e.response.data
          ? String((e.response.data as { error?: string }).error)
          : "Could not send OTP";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [phone]);

  const verify = useCallback(async () => {
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/verify-otp", {
        phone,
        otp: code,
      });
      const payload = res.data?.data as
        | { token?: string; user?: AuthUser }
        | undefined;
      if (!payload?.token || !payload.user) {
        throw new Error("Invalid response");
      }
      await setUser(payload.user, payload.token);
      onLoggedIn?.();
    } catch (e: unknown) {
      const msg =
        e &&
        typeof e === "object" &&
        "response" in e &&
        e.response &&
        typeof e.response === "object" &&
        "data" in e.response &&
        e.response.data &&
        typeof e.response.data === "object" &&
        "error" in e.response.data
          ? String((e.response.data as { error?: string }).error)
          : "Verification failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [otp, phone, setUser, onLoggedIn]);

  const onOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    if (digit && i < 5) {
      otpRefs.current[i + 1]?.focus();
    }
  };

  const onOtpKeyPress = (i: number, key: string) => {
    if (key === "Backspace" && !otp[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Sign in with phone</Text>
      <Text style={styles.hint}>
        We will send a 6-digit OTP to your number.
      </Text>

      {step === "phone" ? (
        <>
          <Text style={styles.label}>Mobile number</Text>
          <TextInput
            style={styles.input}
            placeholder="10-digit mobile"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
          <Pressable
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={sendOtp}
            disabled={loading || phone.length !== 10}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnTxt}>Send OTP</Text>
            )}
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Enter OTP</Text>
          <View style={styles.otpRow}>
            {otp.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  otpRefs.current[i] = r;
                }}
                style={styles.otpCell}
                keyboardType="number-pad"
                maxLength={1}
                value={d}
                onChangeText={(v) => onOtpChange(i, v)}
                onKeyPress={({ nativeEvent }) =>
                  onOtpKeyPress(i, nativeEvent.key)
                }
              />
            ))}
          </View>
          <Pressable
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={verify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnTxt}>Verify & Continue</Text>
            )}
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => setStep("phone")}>
            <Text style={styles.linkTxt}>Change number</Text>
          </Pressable>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: LIGHT,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    marginBottom: 16,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpCell: {
    width: 46,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LIGHT,
    backgroundColor: "#fff",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  linkBtn: {
    marginTop: 16,
    alignItems: "center",
  },
  linkTxt: {
    color: PRIMARY,
    fontWeight: "600",
    fontSize: 15,
  },
  error: {
    marginTop: 12,
    color: "#DC2626",
    fontSize: 14,
  },
});
