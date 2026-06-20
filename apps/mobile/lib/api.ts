import axios from "axios";
import { router } from "expo-router";

import { getTokenAsync } from "./auth";
import { PUBLIC_API_BASE_URL } from "./env";
import { useAppStore } from "./store";

const baseURL = PUBLIC_API_BASE_URL;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

function isFormDataBody(data: unknown): boolean {
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    return true;
  }
  // React Native FormData may not pass instanceof reliably; _parts is the internal shape.
  return (
    typeof data === "object" &&
    data !== null &&
    "_parts" in data &&
    Array.isArray((data as { _parts?: unknown })._parts)
  );
}

api.interceptors.request.use(async (config) => {
  if (isFormDataBody(config.data)) {
    config.headers["Content-Type"] = false;
  }
  const token = await getTokenAsync();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      useAppStore.getState().logout();
      router.replace("/auth/login");
    }
    return Promise.reject(error);
  }
);

export { api, baseURL };
export default api;
