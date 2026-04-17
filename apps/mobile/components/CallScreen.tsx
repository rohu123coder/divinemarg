import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  name: string;
  photo?: string | null;
  onEnd: () => void;
};

export function CallScreen({ name, photo, onEnd }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connected</Text>
        <Text style={styles.subtitle}>{name}</Text>
      </View>
      <View style={styles.avatarWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.avatar} />
        ) : (
          <Ionicons name="person" size={64} color="#D4AF37" />
        )}
      </View>
      <View style={styles.controls}>
        <Pressable style={styles.controlBtn}>
          <Ionicons name="mic-off" size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.controlBtn}>
          <Ionicons name="videocam-off" size={20} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.endBtn} onPress={onEnd}>
          <Ionicons name="call" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0A1E",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 48,
  },
  header: { alignItems: "center", gap: 6 },
  title: { color: "#D4AF37", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#E5E7EB", fontSize: 16 },
  avatarWrap: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatar: { width: 200, height: 200, borderRadius: 100 },
  controls: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7C3AED",
    alignItems: "center",
    justifyContent: "center",
  },
  endBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "135deg" }],
  },
});
