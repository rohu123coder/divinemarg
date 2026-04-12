import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PhoneLoginForm } from "../components/PhoneLoginForm";

const LIGHT = "#EDE9FE";

export default function LoginScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <PhoneLoginForm
            onLoggedIn={() => {
              router.replace("/(tabs)");
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: LIGHT,
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: LIGHT,
  },
});
