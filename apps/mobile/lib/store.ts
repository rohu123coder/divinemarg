import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";

import { setToken } from "./auth";

type StorageAdapter = {
  set: (key: string, value: string) => void;
  getString: (key: string) => string | undefined;
  delete: (key: string) => void;
};

const memoryStore = new Map<string, string>();
const fallbackStorage: StorageAdapter = {
  set: (key, value) => {
    memoryStore.set(key, value);
  },
  getString: (key) => memoryStore.get(key),
  delete: (key) => {
    memoryStore.delete(key);
  },
};

const createStorageAdapter = (): StorageAdapter => {
  try {
    return new MMKV({ id: "divinemarg-store" });
  } catch {
    // Fallback for non-native environments.
  }
  return fallbackStorage;
};

const mmkv = createStorageAdapter();

type MMKVStorage = {
  setItem: (key: string, value: string) => void;
  getItem: (key: string) => string | null;
  removeItem: (key: string) => void;
};

const zustandStorage: MMKVStorage = {
  setItem: (key, value) => mmkv.set(key, value),
  getItem: (key) => mmkv.getString(key) ?? null,
  removeItem: (key) => mmkv.delete(key),
};

export type User = {
  id: string;
  name: string;
  phone: string;
  wallet_balance: number;
  profile_photo: string | null;
};

export type Astrologer = {
  id: string;
  name: string;
  profile_photo: string | null;
  specialization: string;
  languages: string[];
  experience_years: number;
  rating: number;
  orders: number;
  price_per_min: number;
  status: "online" | "busy" | "offline";
  wait_time_minutes?: number;
};

export type ActiveSession = {
  id: string;
  astrologer_id: string;
  astrologer_name: string;
  astrologer_photo: string | null;
  mode: "chat" | "call";
  date: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
};

type AppState = {
  user: User | null;
  token: string;
  isLoggedIn: boolean;
  astrologers: Astrologer[];
  activeSessions: ActiveSession[];
  notifications: Notification[];
  hydrateAuth: (payload: { user: User; token: string }) => void;
  logout: () => void;
  setAstrologers: (astrologers: Astrologer[]) => void;
  setActiveSessions: (sessions: ActiveSession[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setWalletBalance: (amount: number) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      token: "",
      isLoggedIn: false,
      astrologers: [],
      activeSessions: [],
      notifications: [],
      hydrateAuth: ({ user, token }) => {
        setToken(token);
        set({ user, token, isLoggedIn: true });
      },
      logout: () => {
        setToken(null);
        set({ user: null, token: "", isLoggedIn: false });
      },
      setAstrologers: (astrologers) => set({ astrologers }),
      setActiveSessions: (activeSessions) => set({ activeSessions }),
      setNotifications: (notifications) => set({ notifications }),
      setWalletBalance: (amount) =>
        set((state) => {
          if (!state.user) {
            return state;
          }
          return {
            user: {
              ...state.user,
              wallet_balance: amount,
            },
          };
        }),
    }),
    {
      name: "divinemarg-app",
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
        astrologers: state.astrologers,
        activeSessions: state.activeSessions,
        notifications: state.notifications,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setToken(state.token);
        }
      },
    }
  )
);
