/**
 * JS-only splash UI (Animated + Image). No native modules or expo-notifications.
 */
import { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Image,
  type DimensionValue,
  StyleSheet,
  Text,
  View,
} from "react-native";

const zodiac = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

/** Fixed layout so zodiac positions are stable across renders */
const SCATTER = [
  { sym: 0, top: "8%", left: "12%" },
  { sym: 3, top: "14%", left: "78%" },
  { sym: 6, top: "22%", left: "6%" },
  { sym: 9, top: "31%", left: "88%" },
  { sym: 1, top: "42%", left: "4%" },
  { sym: 4, top: "48%", left: "92%" },
  { sym: 7, top: "58%", left: "10%" },
  { sym: 10, top: "65%", left: "82%" },
  { sym: 2, top: "72%", left: "18%" },
  { sym: 5, top: "78%", left: "70%" },
  { sym: 8, top: "88%", left: "28%" },
  { sym: 11, top: "92%", left: "55%" },
  { sym: 0, top: "52%", left: "48%" },
  { sym: 6, top: "18%", left: "42%" },
  { sym: 3, top: "38%", left: "62%" },
];

export function AppSplashScreen() {
  const fade = useRef(new Animated.Value(0)).current;

  const scattered = useMemo(
    () =>
      SCATTER.map((s, i) => ({
        id: `z-${i}`,
        char: zodiac[s.sym],
        top: s.top,
        left: s.left,
      })),
    []
  );

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <View style={styles.container}>
      {scattered.map((item) => (
        <Text
          key={item.id}
          style={[
            styles.zodiacBg,
            { top: item.top as DimensionValue, left: item.left as DimensionValue },
          ]}
        >
          {item.char}
        </Text>
      ))}
      <Animated.View style={[styles.center, { opacity: fade }]}>
        <Image
          source={require("../assets/icon.png")}
          style={styles.logo}
          resizeMode="cover"
          accessibilityLabel="DivineMarg logo"
        />
        <Text style={styles.brand}>DivineMarg</Text>
        <Text style={styles.tagline}>Astrology & Vastu</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: "#B8960C",
    letterSpacing: 0.3,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "400",
  },
  zodiacBg: {
    position: "absolute",
    fontSize: 28,
    color: "rgba(156, 163, 175, 0.06)",
  },
});
