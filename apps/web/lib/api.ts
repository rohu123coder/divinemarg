import axios from "axios";

import { useAuthStore } from "./store";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:4000";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") {
    return config;
  }
  const token = localStorage.getItem("divinemarg_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      localStorage.removeItem("divinemarg_token");
      useAuthStore.getState().logout();
      const path = window.location.pathname;
      if (path.startsWith("/astrologer")) {
        if (path !== "/astrologer/login") {
          window.location.href = "/astrologer/login";
        }
      } else if (path !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
