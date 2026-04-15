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
  isWalletRefreshing: boolean;
  setUser: (user: AuthUser, token: string) => void;
  updateWalletBalance: (amount: number) => void;
  refreshWalletBalance: () => Promise<void>;
  logout: () => void;
};

const TOKEN_KEY = "divinemarg_token";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoggedIn: false,
      isWalletRefreshing: false,
      setUser: (user, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(TOKEN_KEY, token);
        }
        set({ user, token, isLoggedIn: true, isWalletRefreshing: false });
      },
      updateWalletBalance: (amount) => {
        const u = get().user;
        if (u) {
          set({ user: { ...u, wallet_balance: amount } });
        }
      },
      refreshWalletBalance: async () => {
        const { token, user, isWalletRefreshing } = get();
        if (!token || !user || isWalletRefreshing || typeof window === "undefined") {
          return;
        }

        set({ isWalletRefreshing: true });
        try {
          const baseURL =
            process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
            "http://localhost:4000";

          const walletRes = await fetch(`${baseURL}/api/users/wallet`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!walletRes.ok) {
            throw new Error("Failed to refresh wallet");
          }

          const walletPayload = (await walletRes.json()) as {
            data?: { balance?: number };
          };
          const nextBalance = walletPayload?.data?.balance;

          if (typeof nextBalance === "number") {
            set({ user: { ...user, wallet_balance: nextBalance } });
          }
        } catch (error) {
          console.error("Wallet refresh failed", error);
        } finally {
          set({ isWalletRefreshing: false });
        }
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_KEY);
        }
        set({
          user: null,
          token: null,
          isLoggedIn: false,
          isWalletRefreshing: false,
        });
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
