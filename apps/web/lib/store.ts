import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type AuthUser = {
  id: string;
  name: string;
  phone: string;
  avatar_url: string | null;
  wallet_balance: number;
  role?: "user" | "astrologer";
  /** Set when `role === "astrologer"` — public astrologer row id for profile APIs */
  astrologerId?: string;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  setUser: (user: AuthUser, token: string) => void;
  updateWalletBalance: (amount: number) => void;
  logout: () => void;
};

const TOKEN_KEY = "divinemarg_token";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      setUser: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, token);
        }
        set({ user, token, isLoggedIn: true });
      },
      updateWalletBalance: (amount) => {
        const u = get().user;
        if (u) {
          set({ user: { ...u, wallet_balance: amount } });
        }
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_KEY);
        }
        set({ user: null, token: null, isLoggedIn: false });
      },
    }),
    {
      name: "divinemarg-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, state.token);
        }
      },
    }
  )
);
