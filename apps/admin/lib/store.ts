import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminUser = {
  id: string;
  email: string;
  role: string;
};

type AdminState = {
  admin: AdminUser | null;
  token: string | null;
  isLoggedIn: boolean;
  setAdmin: (admin: AdminUser, token: string) => void;
  logout: () => void;
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      admin: null,
      token: null,
      isLoggedIn: false,
      setAdmin: (admin, token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_token", token);
        }
        set({ admin, token, isLoggedIn: true });
      },
      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("admin_token");
        }
        set({ admin: null, token: null, isLoggedIn: false });
      },
    }),
    {
      name: "divinemarg-admin",
      partialize: (state) => ({
        admin: state.admin,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && typeof window !== "undefined") {
          localStorage.setItem("admin_token", state.token);
        }
      },
    }
  )
);
