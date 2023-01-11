// const Constants = require("expo-constants");

const env = process.env.EXPO_ENVIRONMENT;

/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
export const getBaseUrl = () => {
  /**
   * Gets the IP address of your host-machine. If it cannot automatically find it,
   * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
   * you don't have anything else running on it, or you'd have to change it.
   */
  const localhost =
    // Constants.manifest?.debuggerHost?.split(":")[0] ??
    process.env.LOCALHOST ?? "localhost";

  const appUrl = env === "production" ? "" : `http://${localhost}:3000`;
  return appUrl;
};

const APP_URL = getBaseUrl();
const API_URL = APP_URL + "/api/trpc";
const AUTH_URL = APP_URL + "/api/auth";

/**
 *
 * @param {} param0 import("@expo/config").ConfigContext
 * @returns import("@expo/config").ExpoConfig
 */
const configFn = ({ config }) => ({
  name: "expo",
  slug: "expo",
  version: "1.0.0",
  scheme: "expo",
  owner: "juliusmarminge",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "dark",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#2e026d",
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.juliusmarminge.expo",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#2e026d",
    },
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
  extra: {
    eas: {
      projectId: "768478b6-46cd-43a3-904b-f4d5065648d2",
    },
    APP_URL,
    API_URL,
    AUTH_URL,
    nextAuthUrl: AUTH_URL,
  },
});

module.exports = configFn;
