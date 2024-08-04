import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const key = "token";
export const getToken = () => {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  } else {
    return SecureStore.getItem(key);
  }
};

export const deleteToken = () => {
  if (Platform.OS === "web") {
    return localStorage.removeItem(key);
  } else {
    return SecureStore.deleteItemAsync(key);
  }
};

export const setToken = (v: string) => {
  if (Platform.OS === "web") {
    return localStorage.setItem(key, v);
  } else {
    return SecureStore.setItem(key, v);
  }
};
