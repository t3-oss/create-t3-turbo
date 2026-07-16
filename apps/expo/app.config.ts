import type { ConfigContext, ExpoConfig } from "expo/config";

// Three build variants (development / preview / production). `APP_VARIANT` is set
// per EAS profile in eas.json, or inline for local expo commands. Each variant
// gets its own bundle id + name so all three install side-by-side; production is
// produced only through CI (.github/workflows/mobile-production.yml).
const APP_VARIANT = process.env.APP_VARIANT ?? "development";
const API_URL = process.env.API_URL ?? "http://localhost:3000";
const ASSOCIATED_DOMAIN =
  process.env.EXPO_PUBLIC_APP_DOMAIN ?? "change-me.example.com";

const SENTRY_DSN = process.env.SENTRY_DSN;
const POSTHOG_KEY = process.env.POSTHOG_KEY;
const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://us.i.posthog.com";

const getAppName = (): string => {
  switch (APP_VARIANT) {
    case "production":
      return "Gmacko";
    case "preview":
      return "Gmacko (Preview)";
    default:
      return "Gmacko (Dev)";
  }
};

const getBundleId = (): string => {
  // Scaffold note: replace these app identifiers and domains before store submission.
  const base = "com.gmacko.app";
  switch (APP_VARIANT) {
    case "production":
      return base;
    case "preview":
      return `${base}.preview`;
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
    "expo-apple-authentication",
    [
      "expo-camera",
      {
        cameraPermission:
          "Allow $(PRODUCT_NAME) to use the camera to scan sign-in QR codes.",
      },
    ],
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
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
    assetBundlePatterns: ["**/*"],
    ios: {
      bundleIdentifier: getBundleId(),
      supportsTablet: true,
      usesAppleSignIn: true,
      associatedDomains: [`applinks:${ASSOCIATED_DOMAIN}`],
      icon: {
        light: "./assets/icon-light.png",
        dark: "./assets/icon-dark.png",
      },
      infoPlist: {
        CFBundleDisplayName: getAppName(),
      },
    },
    android: {
      package: getBundleId(),
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: ASSOCIATED_DOMAIN,
              pathPrefix: "/",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      adaptiveIcon: {
        foregroundImage: "./assets/icon-light.png",
        backgroundColor: "#1F104A",
      },
    },
    extra: {
      APP_VARIANT,
      API_URL,
      SENTRY_DSN,
      POSTHOG_KEY,
      POSTHOG_HOST,
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
