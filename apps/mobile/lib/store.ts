import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

import { setToken } from "./auth-token";

export const TOKEN_KEY = "divinemarg_token";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  avatar_url: string | null;
  wallet_balance: number;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  setUser: (user: AuthUser, token: string) => Promise<void>;
  hydrate: (user: AuthUser, token: string) => void;
  setUserPartial: (partial: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoggedIn: false,

  hydrate: (user, token) => {
    setToken(token);
    set({ user, token, isLoggedIn: true });
  },

  setUser: async (user, token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    setToken(token);
    set({ user, token, isLoggedIn: true });
  },

  setUserPartial: (partial) =>
    set((s) => (s.user ? { user: { ...s.user, ...partial } } : {})),

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    set({ user: null, token: null, isLoggedIn: false });
  },
}));
