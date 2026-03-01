import type { ConfigContext, ExpoConfig } from "expo/config";

const APP_ENV = process.env.APP_ENV ?? "development";
const API_URL = process.env.API_URL ?? "http://localhost:3000";

const SENTRY_DSN = process.env.SENTRY_DSN;
const POSTHOG_KEY = process.env.POSTHOG_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

const REVENUECAT_API_KEY_IOS = process.env.REVENUECAT_API_KEY_IOS;
const REVENUECAT_API_KEY_ANDROID = process.env.REVENUECAT_API_KEY_ANDROID;

const getAppName = (): string => {
  switch (APP_ENV) {
    case "production":
      return "Gmacko";
    case "staging":
      return "Gmacko (Beta)";
    default:
      return "Gmacko (Dev)";
  }
};

const getBundleId = (): string => {
  const base = "com.gmacko.app";
  switch (APP_ENV) {
    case "production":
      return base;
    case "staging":
      return `${base}.beta`;
    default:
      return `${base}.dev`;
  }
};

const getSentryConfig = () => {
  if (!SENTRY_DSN) return null;

  return [
    "@sentry/react-native/expo",
    {
      organization: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    },
  ];
};

export default ({ config }: ConfigContext): ExpoConfig => {
  const sentryPlugin = getSentryConfig();
  const plugins: ExpoConfig["plugins"] = [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    // Biometric authentication (Face ID / Touch ID / Fingerprint)
    [
      "expo-local-authentication",
      {
        faceIDPermission:
          "Allow $(PRODUCT_NAME) to use Face ID for quick, secure login.",
      },
    ],
    // App Tracking Transparency (required for iOS 14.5+ / App Store Review 5.1.2)
    [
      "expo-tracking-transparency",
      {
        userTrackingPermission:
          "Allow $(PRODUCT_NAME) to collect app-related data for improving your experience. Your data is never sold to third parties.",
      },
    ],
    // Push notifications
    "expo-notifications",
    // Splash screen
    [
      "expo-splash-screen",
      {
        backgroundColor: "#E4E4E7",
        image: "./assets/icon-light.png",
        dark: {
          backgroundColor: "#18181B",
          image: "./assets/icon-dark.png",
        },
      },
    ],
  ];

  if (sentryPlugin) {
    plugins.push(sentryPlugin as [string, Record<string, unknown>]);
  }

  return {
    ...config,
    name: getAppName(),
    slug: "gmacko",
    scheme: "gmacko",
    version: "0.1.0",
    orientation: "portrait",
    icon: "./assets/icon-light.png",
    userInterfaceStyle: "automatic",
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/your-project-id",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    newArchEnabled: true,
    assetBundlePatterns: ["**/*"],
    ios: {
      bundleIdentifier: getBundleId(),
      supportsTablet: true,
      icon: {
        light: "./assets/icon-light.png",
        dark: "./assets/icon-dark.png",
      },
      infoPlist: {
        CFBundleDisplayName: getAppName(),
        // Face ID usage description (App Store Review Guideline 5.1.1)
        NSFaceIDUsageDescription:
          "$(PRODUCT_NAME) uses Face ID for quick and secure authentication.",
        // Camera (if user uploads profile photos etc.)
        NSCameraUsageDescription:
          "$(PRODUCT_NAME) needs camera access to take profile photos.",
        // Photo library
        NSPhotoLibraryUsageDescription:
          "$(PRODUCT_NAME) needs photo library access to select profile photos.",
        // Push notifications background mode
        UIBackgroundModes: ["remote-notification"],
      },
      // In-app purchases entitlement
      entitlements: {
        "com.apple.developer.in-app-payments": [],
      },
    },
    android: {
      package: getBundleId(),
      adaptiveIcon: {
        foregroundImage: "./assets/icon-light.png",
        backgroundColor: "#1F104A",
      },
      edgeToEdgeEnabled: true,
      permissions: [
        "USE_BIOMETRIC",
        "USE_FINGERPRINT",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "com.android.vending.BILLING",
      ],
    },
    extra: {
      APP_ENV,
      API_URL,
      SENTRY_DSN,
      POSTHOG_KEY,
      POSTHOG_HOST,
      REVENUECAT_API_KEY_IOS,
      REVENUECAT_API_KEY_ANDROID,
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
    },
    owner: process.env.EXPO_OWNER,
    experiments: {
      tsconfigPaths: true,
      typedRoutes: true,
      reactCanary: true,
      reactCompiler: true,
    },
    plugins,
  };
};
