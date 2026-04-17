type SimpleKV = {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  delete: (key: string) => void;
};

const memoryStore = new Map<string, string>();

const fallbackStorage: SimpleKV = {
  getString: (key) => memoryStore.get(key),
  set: (key, value) => {
    memoryStore.set(key, value);
  },
  delete: (key) => {
    memoryStore.delete(key);
  },
};

const createStorage = (): SimpleKV => {
  try {
    const mod = require("react-native-mmkv") as { MMKV?: new (args: { id: string }) => SimpleKV };
    if (mod.MMKV) {
      return new mod.MMKV({ id: "divinemarg-auth" });
    }
  } catch {
    // No-op: fallback for environments without native MMKV bindings.
  }
  return fallbackStorage;
};

export const authStorage = createStorage();

export const TOKEN_KEY = "token";

export const getToken = (): string | null => authStorage.getString(TOKEN_KEY) ?? null;

export const setToken = (token: string | null) => {
  if (!token) {
    authStorage.delete(TOKEN_KEY);
    return;
  }
  authStorage.set(TOKEN_KEY, token);
};
