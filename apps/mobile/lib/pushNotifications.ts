import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Alert, Platform } from "react-native";

import { PUBLIC_API_BASE_URL } from "./env";

/** Fallback project ID for local Gradle builds where Constants.expoConfig hydration may omit EAS extra. */
const EAS_PROJECT_ID_FALLBACK = "dcc29648-0c17-42a3-a0fc-ec927c23f9af";

/** Show Alert dialogs for push diagnostics (set false once stable). */
const PUSH_DEBUG = true;

const PUSH_TOKEN_STORAGE_KEY = "@divinemarg_push_token";

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as Record<string, unknown> | undefined;
    const type = typeof data?.type === "string" ? data.type : "";
    const isHighPriority = type === "incoming_call" || type === "incoming_chat";

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: isHighPriority
        ? Notifications.AndroidNotificationPriority.MAX
        : Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync("incoming-call", {
    name: "Incoming Calls",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#FF6B35",
    sound: "default",
    enableVibrate: true,
    showBadge: true,
  });

  await Notifications.setNotificationChannelAsync("chat-messages", {
    name: "Chat Messages",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    lightColor: "#FF6B35",
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("wallet", {
    name: "Wallet & Payments",
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: "#FF6B35",
    sound: "default",
  });

  await Notifications.setNotificationChannelAsync("promotional", {
    name: "Offers & Updates",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#FF6B35",
  });

  await Notifications.setNotificationChannelAsync("default", {
    name: "General",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: "#FF6B35",
  });
}

/**
 * Request permissions and return an Expo push token, or null if unavailable / denied.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    const msg = "[Push] Not a physical device — emulator detected";
    console.warn(msg);
    if (PUSH_DEBUG) {
      Alert.alert("Push Error", msg);
    }
    return null;
  }

  await setupAndroidChannels();

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    const msg = `[Push] Permission not granted: ${finalStatus}`;
    console.warn(msg);
    if (PUSH_DEBUG) {
      Alert.alert(
        "Push Permission",
        `${msg}\n\nGo to Settings → Apps → DivineMarg → Notifications → Allow`
      );
    }
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId ??
    EAS_PROJECT_ID_FALLBACK;

  if (!projectId) {
    const msg = "[Push] EAS project ID missing — even fallback failed";
    console.error(msg);
    if (PUSH_DEBUG) {
      Alert.alert("Push Error", msg);
    }
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;

    console.log("[Push] Got Expo push token:", token);

    if (PUSH_DEBUG) {
      Alert.alert(
        "Push Token Received ✅",
        `Token: ${token.substring(0, 30)}...\nProject: ${projectId.substring(0, 8)}...`
      );
    }

    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
    return token;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const msg = `[Push] Failed to get token: ${message}`;
    console.error(msg, error);
    if (PUSH_DEBUG) {
      Alert.alert("Push Error", msg);
    }
    return null;
  }
}

export async function sendTokenToBackend(token: string, authToken: string): Promise<boolean> {
  try {
    const url = `${PUBLIC_API_BASE_URL}/api/notifications/register-token`;

    if (PUSH_DEBUG) {
      console.log("[Push] Sending to:", url);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        token,
        platform: Platform.OS,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const msg = `[Push] Backend registration failed: ${response.status} - ${errorBody}`;
      console.error(msg);
      if (PUSH_DEBUG) {
        Alert.alert("Backend Error", msg);
      }
      return false;
    }

    console.log("[Push] Token registered with backend successfully");
    if (PUSH_DEBUG) {
      Alert.alert("Push Success ✅", "Token registered with DivineMarg backend!");
    }
    return true;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const msg = `[Push] Network error: ${message}`;
    console.error(msg, error);
    if (PUSH_DEBUG) {
      Alert.alert("Network Error", msg);
    }
    return false;
  }
}

export async function setupPushNotifications(authToken: string): Promise<void> {
  try {
    if (PUSH_DEBUG) {
      console.log("[Push] Starting setup...");
    }

    const pushToken = await registerForPushNotifications();

    if (!pushToken) {
      if (PUSH_DEBUG) {
        console.warn("[Push] Setup skipped: no push token obtained");
      }
      return;
    }

    await sendTokenToBackend(pushToken, authToken);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const msg = `[Push] Setup error: ${message}`;
    console.error(msg, error);
    if (PUSH_DEBUG) {
      Alert.alert("Push Setup Error", msg);
    }
  }
}

export async function unregisterPushNotifications(authToken: string): Promise<void> {
  try {
    await fetch(`${PUBLIC_API_BASE_URL}/api/notifications/unregister-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });
  } catch (err) {
    console.error("[Push] Unregister request error:", err);
  } finally {
    try {
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    console.log("[Push] Local push token storage cleared");
  }
}
