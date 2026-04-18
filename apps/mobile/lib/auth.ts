import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKEN_KEY = "divinemarg_token";

export const getToken = (): string | null => null; // sync stub

export const getTokenAsync = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = async (token: string | null) => {
  try {
    if (!token) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } else {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    }
  } catch {}
};
