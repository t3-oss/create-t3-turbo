import * as SecureStore from "expo-secure-store";

const key = "session_token";

// In-memory mirror of the keychain value. getToken() is called on every tRPC
// and auth request; reading the keychain synchronously each time blocks the
// JS thread with a native round-trip. All mutations go through setToken /
// deleteToken, so the mirror stays authoritative after the initial read.
let cachedToken: string | null | undefined;

export const getToken = () => {
  if (cachedToken === undefined) {
    cachedToken = SecureStore.getItem(key);
  }
  return cachedToken;
};

export const deleteToken = async () => {
  cachedToken = null;
  await SecureStore.deleteItemAsync(key);
};

export const setToken = (v: string) => {
  cachedToken = v;
  SecureStore.setItem(key, v);
};
