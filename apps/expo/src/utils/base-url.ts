import Constants from "expo-constants";
import { ENV } from "varlock/env";

export const getBaseUrl = () => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];

  if (!localhost) {
    return ENV.EXPO_PUBLIC_API_URL;
  }
  return `http://${localhost}:3000`;
};
