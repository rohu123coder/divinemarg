/**
 * JS-only splash UI (Animated + View/Text). No native modules or expo-notifications.
 */
import { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const zodiac = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const stars = Array.from({ length: 34 }).map((_, i) => ({
  id: `star-${i}`,
  topPct: Math.random() * 100,
  leftPct: Math.random() * 100,
  size: Math.max(1.5, Math.random() * 3.5),
  delay: (i % 6) * 150,
}));

export function AppSplashScreen() {
  const opacity = useRef(new Animated.Value(0)).current;
  const twinkles = useRef(
    stars.map(() => new Animated.Value(0.2))
  ).current;

  const zodiacPositions = useMemo(
    () =>
      zodiac.map((symbol, index) => {
        const angle = (Math.PI * 2 * index) / zodiac.length;
        const radius = 130;
        return {
          symbol,
          left: 180 + radius * Math.cos(angle),
          top: 260 + radius * Math.sin(angle),
        };
      }),
    []
  );

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    twinkles.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(stars[index].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 950,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.25,
            duration: 950,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, [opacity, twinkles]);

  return (
    <View style={styles.container}>
      {stars.map((star, index) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              width: star.size,
              height: star.size,
              top: `${star.topPct}%`,
              left: `${star.leftPct}%`,
              opacity: twinkles[index],
            },
          ]}
        />
      ))}
      {zodiacPositions.map((item) => (
        <Text
          key={item.symbol}
          style={[
            styles.zodiac,
            { left: item.left, top: item.top },
          ]}
        >
          {item.symbol}
        </Text>
      ))}
      <Animated.View style={[styles.content, { opacity }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>DM</Text>
        </View>
        <Text style={styles.brand}>DivineMarg</Text>
        <Text style={styles.tagline}>Astrology & Vastu</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0A1E",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
  },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 2.5,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  logoText: {
    fontSize: 40,
    fontWeight: "800",
    color: "#D4AF37",
  },
  brand: {
    fontSize: 28,
    color: "#D4AF37",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  tagline: {
    marginTop: 8,
    fontSize: 14,
    color: "#9CA3AF",
  },
  zodiac: {
    position: "absolute",
    fontSize: 22,
    color: "rgba(255,255,255,0.08)",
  },
  star: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
  },
});
