import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SecureStore from "expo-secure-store";
import { SafeAreaProvider } from "react-native-safe-area-context";

import api from "../lib/api";
import { setToken } from "../lib/auth-token";
import { TOKEN_KEY, useAuthStore, type AuthUser } from "../lib/store";

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(TOKEN_KEY);
        if (cancelled) return;
        if (!raw) {
          setReady(true);
          await SplashScreen.hideAsync();
          return;
        }
        setToken(raw);
        const res = await api.get("/api/auth/me");
        const user = res.data?.data?.user as AuthUser | undefined;
        if (user && !cancelled) {
          useAuthStore.getState().hydrate(user, raw);
        }
      } catch (e: unknown) {
        const status =
          e &&
          typeof e === "object" &&
          "response" in e &&
          e.response &&
          typeof e.response === "object" &&
          "status" in e.response
            ? (e.response as { status?: number }).status
            : undefined;
        if (status === 401) {
          try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
          } catch {
            /* ignore */
          }
          setToken(null);
          useAuthStore.setState({
            user: null,
            token: null,
            isLoggedIn: false,
          });
        }
      } finally {
        if (!cancelled) {
          setReady(true);
          await SplashScreen.hideAsync();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="login"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="astrologer/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="chat/[sessionId]" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
