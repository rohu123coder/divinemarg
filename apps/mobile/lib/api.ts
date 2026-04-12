import axios from "axios";
import Constants from "expo-constants";
import { router } from "expo-router";

import { getToken, setToken } from "./auth-token";
import { useAuthStore } from "./store";

const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
const baseURL =
  extra?.apiUrl?.replace(/\/$/, "") ?? "http://localhost:4000";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await useAuthStore.getState().logout();
      router.replace("/login");
    }
    return Promise.reject(error);
  }
);

export { api, baseURL, setToken };
export default api;
