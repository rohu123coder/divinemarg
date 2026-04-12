import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PhoneLoginForm } from "../../components/PhoneLoginForm";
import api from "../../lib/api";
import { useAuthStore } from "../../lib/store";

const PRIMARY = "#7C3AED";
const LIGHT = "#EDE9FE";

export default function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const logout = useAuthStore((s) => s.logout);
  const setUserPartial = useAuthStore((s) => s.setUserPartial);

  const [editing, setEditing] = useState(false);
  const [nameEdit, setNameEdit] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    if (user) {
      setNameEdit(user.name);
      setEditing(true);
    }
  };

  const saveName = async () => {
    const n = nameEdit.trim();
    if (!n) {
      return;
    }
    setSaving(true);
    try {
      const res = await api.put("/api/users/profile", { name: n });
      const u = res.data?.data?.user as { name?: string } | undefined;
      if (u?.name) {
        setUserPartial({ name: u.name });
      }
      setEditing(false);
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
          : "Could not update profile";
      Alert.alert("Profile", msg);
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Profile</Text>
          <View style={styles.card}>
            <PhoneLoginForm />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scrollLogged}>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          {editing ? (
            <>
              <TextInput
                style={styles.input}
                value={nameEdit}
                onChangeText={setNameEdit}
                placeholder="Your name"
              />
              <View style={styles.row}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => setEditing(false)}
                >
                  <Text style={styles.secondaryTxt}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryBtn, saving && styles.btnDisabled]}
                  disabled={saving}
                  onPress={() => void saveName()}
                >
                  <Text style={styles.primaryTxt}>Save</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.value}>{user.name}</Text>
              <Pressable style={styles.link} onPress={startEdit}>
                <Text style={styles.linkTxt}>Edit name</Text>
              </Pressable>
            </>
          )}

          <Text style={[styles.label, styles.mt]}>Phone</Text>
          <Text style={styles.value}>{user.phone}</Text>

          <Pressable
            style={styles.logout}
            onPress={() => {
              void logout();
            }}
          >
            <Text style={styles.logoutTxt}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scroll: {
    padding: 16,
  },
  scrollLogged: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: LIGHT,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  mt: {
    marginTop: 20,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 6,
  },
  input: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: LIGHT,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryTxt: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: LIGHT,
  },
  secondaryTxt: {
    fontWeight: "600",
    color: "#4B5563",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  link: {
    marginTop: 10,
    alignSelf: "flex-start",
  },
  linkTxt: {
    color: PRIMARY,
    fontWeight: "700",
  },
  logout: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  logoutTxt: {
    color: "#B91C1C",
    fontWeight: "700",
    fontSize: 16,
  },
});
