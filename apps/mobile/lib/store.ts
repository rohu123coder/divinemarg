import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { setToken } from "./auth";

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
        void setToken(token);
        set({ user, token, isLoggedIn: true });
      },
      logout: () => {
        void setToken(null);
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
          return { user: { ...state.user, wallet_balance: amount } };
        }),
    }),
    {
      name: "divinemarg-app",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          void setToken(state.token);
        }
      },
    }
  )
);
