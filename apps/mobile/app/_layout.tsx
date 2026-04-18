import { useEffect, useMemo, useState } from "react";
import { router, Stack, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppSplashScreen } from "../components/SplashScreen";
import { getTokenAsync } from "../lib/auth";
import api from "../lib/api";
import { useAppStore, type User } from "../lib/store";

export default function RootLayout() {
  const segments = useSegments();
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const hydrateAuth = useAppStore((state) => state.hydrateAuth);
  const logout = useAppStore((state) => state.logout);

  const inAuthGroup = useMemo(() => segments[0] === "auth", [segments]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getTokenAsync();
        if (!token) {
          logout();
        } else {
          const res = await api.get("/api/auth/me");
          const payload = res.data?.data?.user as
            | {
                id: string;
                name: string;
                phone: string;
                wallet_balance: number;
                profile_photo?: string | null;
                avatar_url?: string | null;
              }
            | undefined;
          if (payload) {
            const user: User = {
              id: payload.id,
              name: payload.name,
              phone: payload.phone,
              wallet_balance: payload.wallet_balance ?? 0,
              profile_photo: payload.profile_photo ?? payload.avatar_url ?? null,
            };
            hydrateAuth({ user, token });
          } else {
            logout();
          }
        }
      } catch {
        logout();
      } finally {
        setReady(true);
      }
    })();
  }, [hydrateAuth, logout]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || showSplash) {
      return;
    }
    if (isLoggedIn && inAuthGroup) {
      router.replace("/(tabs)");
      return;
    }
    if (!isLoggedIn && !inAuthGroup) {
      router.replace("/auth/login");
    }
  }, [inAuthGroup, isLoggedIn, ready, showSplash]);

  if (!ready || showSplash) {
    return <AppSplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="astrologer/[id]" />
        <Stack.Screen name="chat/[sessionId]" options={{ headerShown: false }} />
        <Stack.Screen name="call/[sessionId]" options={{ headerShown: false }} />
        <Stack.Screen name="wallet/index" />
        <Stack.Screen name="wallet/recharge" />
        <Stack.Screen name="account/index" />
        <Stack.Screen name="account/sessions" />
      </Stack>
    </SafeAreaProvider>
  );
}
