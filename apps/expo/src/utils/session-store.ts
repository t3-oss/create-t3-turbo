import * as SecureStore from "expo-secure-store";

const key = "session_token";
export const getToken = () => SecureStore.getItemAsync(key);
export const deleteToken = () => SecureStore.deleteItemAsync(key);
export const setToken = (v: string) => SecureStore.setItemAsync(key, v);
