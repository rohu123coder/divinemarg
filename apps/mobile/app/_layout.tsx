import * as Notifications from "expo-notifications";
import { useEffect, useMemo, useRef, useState } from "react";
import { router, Stack, usePathname, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppSplashScreen } from "../components/SplashScreen";
import { getTokenAsync } from "../lib/auth";
import api from "../lib/api";
import { checkProfileComplete } from "../lib/profileComplete";
import { setupPushNotifications } from "../lib/pushNotifications";
import { useAppStore, type User } from "../lib/store";

export default function RootLayout() {
  const segments = useSegments();
  const pathname = usePathname();
  const [showSplash, setShowSplash] = useState(true);
  const [ready, setReady] = useState(false);
  const isLoggedIn = useAppStore((state) => state.isLoggedIn);
  const profileComplete = useAppStore((state) => state.profileComplete);
  const hydrateAuth = useAppStore((state) => state.hydrateAuth);
  const logout = useAppStore((state) => state.logout);

  const inAuthGroup = useMemo(() => segments[0] === "auth", [segments]);

  const notificationListener = useRef<ReturnType<
    typeof Notifications.addNotificationReceivedListener
  > | null>(null);
  const responseListener = useRef<ReturnType<
    typeof Notifications.addNotificationResponseReceivedListener
  > | null>(null);

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log("[Push] Notification received (foreground):", notification.request.identifier);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      console.log("[Push] Notification opened, data:", data);

      const type = typeof data?.type === "string" ? data.type : "";
      const sessionId = typeof data?.sessionId === "string" ? data.sessionId : undefined;

      if (type === "incoming_call" && sessionId) {
        router.push(`/call/${sessionId}`);
      } else if (type === "incoming_chat" && sessionId) {
        router.push(`/chat/${sessionId}`);
      } else if (type === "wallet_credited") {
        router.push("/wallet");
      } else if (type === "promotional" && typeof data?.deepLink === "string") {
        const path = data.deepLink;
        if (path.startsWith("/")) {
          router.push(path);
        }
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

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
            void setupPushNotifications(token);
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

    if (!isLoggedIn) {
      if (!inAuthGroup) {
        router.replace("/auth/login");
      }
      return;
    }

    if (profileComplete === null) {
      void checkProfileComplete();
      return;
    }

    const onBirthDetails = pathname.startsWith("/profile/birth-details");

    if (profileComplete === false && !onBirthDetails) {
      router.replace("/profile/birth-details?onboarding=true");
      return;
    }

    if (inAuthGroup) {
      router.replace(
        profileComplete ? "/(tabs)" : "/profile/birth-details?onboarding=true"
      );
    }
  }, [inAuthGroup, isLoggedIn, ready, showSplash, profileComplete, pathname]);

  if (!ready || showSplash || (isLoggedIn && profileComplete === null)) {
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
        <Stack.Screen name="chat/problem-area" options={{ headerShown: false }} />
        <Stack.Screen name="profile/birth-details" options={{ headerShown: false }} />
        <Stack.Screen name="call/[sessionId]" options={{ headerShown: false }} />
        <Stack.Screen name="wallet/index" />
        <Stack.Screen name="wallet/recharge" />
        <Stack.Screen name="account/index" />
        <Stack.Screen name="account/sessions" />
      </Stack>
    </SafeAreaProvider>
  );
}
