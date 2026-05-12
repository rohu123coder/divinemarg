import DateTimePicker from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import api from "../../lib/api";

const MARITAL_OPTIONS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "engaged", label: "Engaged" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

const OCCUPATION_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "job", label: "Job/Service" },
  { value: "business", label: "Business" },
  { value: "housewife", label: "Housewife" },
  { value: "retired", label: "Retired" },
  { value: "other", label: "Other" },
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const PRESET_CITIES = [
  { name: "Delhi, India", lat: 28.6139, lng: 77.209 },
  { name: "Mumbai, India", lat: 19.076, lng: 72.8777 },
  { name: "Bangalore, India", lat: 12.9716, lng: 77.5946 },
  { name: "Kolkata, India", lat: 22.5726, lng: 88.3639 },
  { name: "Chennai, India", lat: 13.0827, lng: 80.2707 },
  { name: "Hyderabad, India", lat: 17.385, lng: 78.4867 },
  { name: "Pune, India", lat: 18.5204, lng: 73.8567 },
  { name: "Jaipur, India", lat: 26.9124, lng: 75.7873 },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatYmd(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(s: string | null | undefined): Date {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return new Date(1995, 0, 1);
  }
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatHm(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function parseHm(s: string | null | undefined): Date {
  const d = new Date();
  if (s && /^\d{1,2}:\d{2}$/.test(s.trim())) {
    const [h, m] = s.split(":").map(Number);
    d.setHours(h ?? 0, m ?? 0, 0, 0);
  } else {
    d.setHours(12, 0, 0, 0);
  }
  return d;
}

export default function BirthDetailsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dob, setDob] = useState(new Date(1995, 0, 1));
  const [tob, setTob] = useState(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showTobPicker, setShowTobPicker] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [maritalStatus, setMaritalStatus] = useState<string | null>(null);
  const [occupation, setOccupation] = useState<string | null>(null);
  const [cityIndex, setCityIndex] = useState(0);

  const loadExisting = useCallback(async () => {
    try {
      const res = await api.get("/api/users/birth-details");
      const data = res.data?.data;
      if (data?.dateOfBirth) {
        setDob(parseYmd(data.dateOfBirth));
      }
      if (data?.timeOfBirth) {
        setTob(parseHm(data.timeOfBirth));
      }
      if (data?.gender) {
        setGender(String(data.gender).toLowerCase());
      }
      if (data?.maritalStatus) {
        setMaritalStatus(String(data.maritalStatus).toLowerCase());
      }
      if (data?.occupation) {
        setOccupation(String(data.occupation).toLowerCase());
      }
      if (data?.placeName && data.lat != null && data.lng != null) {
        const idx = PRESET_CITIES.findIndex(
          (c) =>
            Math.abs(c.lat - Number(data.lat)) < 0.05 &&
            Math.abs(c.lng - Number(data.lng)) < 0.05
        );
        if (idx >= 0) setCityIndex(idx);
      }
    } catch {
      Alert.alert("Error", "Could not load your details.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadExisting();
  }, [loadExisting]);

  const handleSave = async () => {
    const selectedCity = PRESET_CITIES[cityIndex] ?? PRESET_CITIES[0];
    const dobStr = formatYmd(dob);
    const tobStr = formatHm(tob);
    setSaving(true);
    try {
      await api.patch("/api/users/birth-details", {
        dateOfBirth: dobStr,
        timeOfBirth: tobStr,
        placeName: selectedCity.name,
        lat: selectedCity.lat,
        lng: selectedCity.lng,
        utcOffset: 5.5,
        gender: gender || null,
        maritalStatus: maritalStatus || null,
        occupation: occupation || null,
      });
      Alert.alert("Saved", "Your details were updated.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Save failed";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator style={{ marginTop: 40 }} color="#7C3AED" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>My details</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          Birth place and time help us give accurate predictions. You can edit anytime.
        </Text>

        <Text style={styles.label}>Date of birth</Text>
        <Pressable style={styles.fieldBtn} onPress={() => setShowDobPicker(true)}>
          <Text style={styles.fieldTxt}>{formatYmd(dob)}</Text>
        </Pressable>
        {showDobPicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              if (Platform.OS === "android") {
                setShowDobPicker(false);
              }
              if (event.type === "dismissed") return;
              if (date) setDob(date);
            }}
          />
        )}
        {Platform.OS === "ios" && showDobPicker ? (
          <Pressable style={styles.doneAndroid} onPress={() => setShowDobPicker(false)}>
            <Text style={styles.doneAndroidTxt}>Done</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Time of birth</Text>
        <Pressable style={styles.fieldBtn} onPress={() => setShowTobPicker(true)}>
          <Text style={styles.fieldTxt}>{formatHm(tob)}</Text>
        </Pressable>
        {showTobPicker && (
          <DateTimePicker
            value={tob}
            mode="time"
            is24Hour
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              if (Platform.OS === "android") {
                setShowTobPicker(false);
              }
              if (event.type === "dismissed") return;
              if (date) setTob(date);
            }}
          />
        )}
        {Platform.OS === "ios" && showTobPicker ? (
          <Pressable style={styles.doneAndroid} onPress={() => setShowTobPicker(false)}>
            <Text style={styles.doneAndroidTxt}>Done</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Birth place</Text>
        <View style={styles.wrap}>
          {PRESET_CITIES.map((c, i) => (
            <Pressable
              key={c.name}
              onPress={() => setCityIndex(i)}
              style={[styles.chip, cityIndex === i && styles.chipOn]}
            >
              <Text style={[styles.chipTxt, cityIndex === i && styles.chipTxtOn]}>
                {c.name.replace(", India", "")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.wrap}>
          {GENDER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() =>
                setGender(opt.value === gender ? null : opt.value)
              }
              style={[styles.chip, gender === opt.value && styles.chipOn]}
            >
              <Text style={[styles.chipTxt, gender === opt.value && styles.chipTxtOn]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Marital status</Text>
        <View style={styles.wrap}>
          {MARITAL_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() =>
                setMaritalStatus(opt.value === maritalStatus ? null : opt.value)
              }
              style={[styles.chip, maritalStatus === opt.value && styles.chipOn]}
            >
              <Text
                style={[
                  styles.chipTxt,
                  maritalStatus === opt.value && styles.chipTxtOn,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Occupation</Text>
        <View style={styles.wrap}>
          {OCCUPATION_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() =>
                setOccupation(opt.value === occupation ? null : opt.value)
              }
              style={[styles.chip, occupation === opt.value && styles.chipOn]}
            >
              <Text
                style={[styles.chipTxt, occupation === opt.value && styles.chipTxtOn]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={() => void handleSave()}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveTxt}>Save</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  back: { fontSize: 28, color: "#1A1A2E", marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  scroll: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 14, color: "#6B7280", marginBottom: 16, lineHeight: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 4,
  },
  fieldBtn: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
    marginBottom: 8,
  },
  fieldTxt: { fontSize: 16, color: "#1A1A2E" },
  doneAndroid: { alignSelf: "flex-end", marginBottom: 8 },
  doneAndroidTxt: { color: "#7C3AED", fontWeight: "700" },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: {
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipOn: {
    borderColor: "#FF6B35",
    backgroundColor: "#FFF4EF",
  },
  chipTxt: { fontSize: 13, color: "#666", fontWeight: "500" },
  chipTxtOn: { color: "#FF6B35" },
  saveBtn: {
    backgroundColor: "#7C3AED",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveTxt: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
