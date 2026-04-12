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

import type { AstrologerListItem } from "../lib/types";

const PRIMARY = "#7C3AED";
const LIGHT = "#EDE9FE";

type Props = {
  item: AstrologerListItem;
  style?: ViewStyle;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AstrologerCard({ item, style }: Props) {
  const router = useRouter();
  const specText = item.specializations.slice(0, 3).join(" · ");
  const rating =
    item.rating != null ? item.rating.toFixed(1) : "—";
  const price = item.price_per_minute ?? 0;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
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
            <View
              style={[
                styles.badge,
                item.is_available ? styles.badgeOn : styles.badgeOff,
              ]}
            >
              <Text
                style={[
                  styles.badgeTxt,
                  item.is_available ? styles.badgeTxtOn : styles.badgeTxtOff,
                ]}
              >
                {item.is_available ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
          <Text style={styles.spec} numberOfLines={2}>
            {specText || "Astrologer"}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingTxt}>{rating}</Text>
              <Text style={styles.reviewsMuted}>
                ({item.total_reviews})
              </Text>
            </View>
            <Text style={styles.price}>₹{price}/min</Text>
          </View>
        </View>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.chatBtn,
          pressed && styles.chatBtnPressed,
        ]}
        onPress={() => router.push(`/astrologer/${item.id}`)}
      >
        <Text style={styles.chatBtnTxt}>Chat</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LIGHT,
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
    backgroundColor: LIGHT,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: 56,
    height: 56,
  },
  avatarTxt: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeOn: { backgroundColor: "#D1FAE5" },
  badgeOff: { backgroundColor: "#F3F4F6" },
  badgeTxt: { fontSize: 11, fontWeight: "600" },
  badgeTxtOn: { color: "#047857" },
  badgeTxtOff: { color: "#6B7280" },
  spec: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
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
    color: PRIMARY,
  },
  chatBtn: {
    marginTop: 12,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  chatBtnPressed: {
    opacity: 0.9,
  },
  chatBtnTxt: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
