import axios from "axios";
import { router } from "expo-router";

import { getTokenAsync } from "./auth";
import { useAppStore } from "./store";

const baseURL = "https://divinemarg.onrender.com";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
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
