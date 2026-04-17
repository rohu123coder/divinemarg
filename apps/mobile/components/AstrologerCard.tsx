import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import type { Astrologer } from "../lib/store";

type Props = {
  item: Astrologer;
  mode?: "chat" | "call";
  style?: ViewStyle;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const COLORS = {
  primary: "#7C3AED",
  gold: "#D4AF37",
  text: "#1A1A2E",
  secondary: "#6B7280",
  card: "#FFFFFF",
  online: "#10B981",
  busy: "#EF4444",
};

export function AstrologerCard({ item, mode = "chat", style }: Props) {
  const router = useRouter();
  const isBusy = item.status === "busy";
  const isOnline = item.status === "online";
  const isOffline = item.status === "offline";
  const actionText = mode === "chat" ? "Chat" : "Call";
  const buttonColor = isOnline ? COLORS.online : isBusy ? COLORS.busy : "#9CA3AF";

  const handleAction = () => {
    if (isOffline) {
      return;
    }
    if (mode === "chat") {
      router.push(`/astrologer/${item.id}`);
      return;
    }
    router.push(`/call/${item.id}`);
  };

  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={[styles.avatarWrap, isOnline && styles.avatarRing]}>
          {item.profile_photo ? (
            <Image
              source={{ uri: item.profile_photo }}
              style={styles.avatarImg}
            />
          ) : (
            <Text style={styles.avatarTxt}>{initials(item.name)}</Text>
          )}
        </View>
        <View style={styles.main}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.online} />
            <Text style={styles.verified}>Verified</Text>
          </View>
          <Text style={styles.spec} numberOfLines={2}>
            {item.specialization}
          </Text>
          <Text style={styles.spec} numberOfLines={1}>
            {item.languages.join(", ")}
          </Text>
          <Text style={styles.spec} numberOfLines={1}>
            Exp: {item.experience_years} Years
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingTxt}>{item.rating.toFixed(1)}</Text>
              <Text style={styles.reviewsMuted}>{item.orders}+ orders</Text>
            </View>
            <Text style={styles.price}>₹{item.price_per_min}/min</Text>
          </View>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.chatBtn,
          { borderColor: buttonColor },
          isOffline && styles.chatBtnDisabled,
          pressed && styles.chatBtnPressed,
        ]}
        onPress={handleAction}
        disabled={isOffline}
      >
        <Text style={[styles.chatBtnTxt, { color: buttonColor }]}>
          {isOffline ? "Offline" : actionText}
        </Text>
      </Pressable>
      {isBusy ? (
        <>
          <Text style={styles.waiting}>Wait ~{item.wait_time_minutes ?? 3}m</Text>
          <Text style={styles.demand}>High in demand! Join waitlist</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EEE7FF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#F3F4F6",
  },
  avatarRing: { borderColor: COLORS.gold },
  avatarImg: {
    width: 56,
    height: 56,
  },
  avatarTxt: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  verified: { fontSize: 12, color: COLORS.secondary, fontWeight: "600" },
  spec: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.secondary,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingTxt: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  reviewsMuted: {
    fontSize: 13,
    color: "#9CA3AF",
  },
  price: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
  },
  chatBtn: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    alignItems: "center",
  },
  chatBtnDisabled: {
    backgroundColor: "#F3F4F6",
  },
  chatBtnPressed: {
    opacity: 0.9,
  },
  chatBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
  },
  waiting: {
    marginTop: 6,
    color: COLORS.busy,
    fontSize: 12,
    fontWeight: "600",
  },
  demand: {
    marginTop: 2,
    color: COLORS.secondary,
    fontSize: 12,
  },
});
