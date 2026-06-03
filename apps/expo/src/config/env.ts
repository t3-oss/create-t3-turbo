import Constants from "expo-constants";

export type AppEnvironment = "development" | "preview" | "production";

interface ObservabilityConfig {
  sentryDsn?: string;
  posthogKey?: string;
  posthogHost: string;
}

interface EnvironmentConfig {
  apiUrl: string;
  environment: AppEnvironment;
  isDevelopment: boolean;
  isPreview: boolean;
  isProduction: boolean;
  enableDebugMode: boolean;
  observability: ObservabilityConfig;
}

function getAppEnvironment(): AppEnvironment {
  // Read the build variant (APP_VARIANT); tolerate the legacy APP_ENV/"staging".
  const env =
    Constants.expoConfig?.extra?.APP_VARIANT ??
    process.env.APP_VARIANT ??
    Constants.expoConfig?.extra?.APP_ENV ??
    process.env.APP_ENV;
  if (env === "production") return "production";
  if (env === "preview" || env === "staging") return "preview";
  return "development";
}

function getApiUrl(): string {
  const envApiUrl = Constants.expoConfig?.extra?.API_URL ?? process.env.API_URL;
  if (envApiUrl) return envApiUrl;

  const environment = getAppEnvironment();

  switch (environment) {
    case "production":
      return (
        process.env.EXPO_PUBLIC_PRODUCTION_API_URL ?? "https://api.yourapp.com"
      );
    case "preview":
      return (
        process.env.EXPO_PUBLIC_STAGING_API_URL ??
        "https://staging-api.yourapp.com"
      );
    case "development":
    default: {
      const debuggerHost = Constants.expoConfig?.hostUri;
      const localhost = debuggerHost?.split(":")[0];
      if (localhost) {
        return `http://${localhost}:3000`;
      }
      return "http://localhost:3000";
    }
  }
}

function getObservabilityConfig(): ObservabilityConfig {
  const environment = getAppEnvironment();

  const sentryDsn =
    Constants.expoConfig?.extra?.SENTRY_DSN ??
    getSentryDsnForEnvironment(environment);

  const posthogKey =
    Constants.expoConfig?.extra?.POSTHOG_KEY ??
    getPosthogKeyForEnvironment(environment);

  const posthogHost =
    Constants.expoConfig?.extra?.POSTHOG_HOST ??
    process.env.EXPO_PUBLIC_POSTHOG_HOST ??
    "https://us.i.posthog.com";

  return {
    sentryDsn,
    posthogKey,
    posthogHost,
  };
}

function getSentryDsnForEnvironment(
  environment: AppEnvironment,
): string | undefined {
  switch (environment) {
    case "production":
      return (
        process.env.EXPO_PUBLIC_SENTRY_DSN_PROD ??
        process.env.EXPO_PUBLIC_SENTRY_DSN
      );
    case "preview":
      return (
        process.env.EXPO_PUBLIC_SENTRY_DSN_STAGING ??
        process.env.EXPO_PUBLIC_SENTRY_DSN
      );
    case "development":
    default:
      return (
        process.env.EXPO_PUBLIC_SENTRY_DSN_DEV ??
        process.env.EXPO_PUBLIC_SENTRY_DSN
      );
  }
}

function getPosthogKeyForEnvironment(
  environment: AppEnvironment,
): string | undefined {
  switch (environment) {
    case "production":
      return (
        process.env.EXPO_PUBLIC_POSTHOG_KEY_PROD ??
        process.env.EXPO_PUBLIC_POSTHOG_KEY
      );
    case "preview":
      return (
        process.env.EXPO_PUBLIC_POSTHOG_KEY_STAGING ??
        process.env.EXPO_PUBLIC_POSTHOG_KEY
      );
    case "development":
    default:
      return (
        process.env.EXPO_PUBLIC_POSTHOG_KEY_DEV ??
        process.env.EXPO_PUBLIC_POSTHOG_KEY
      );
  }
}

export function getEnvConfig(): EnvironmentConfig {
  const environment = getAppEnvironment();

  return {
    apiUrl: getApiUrl(),
    environment,
    isDevelopment: environment === "development",
    isPreview: environment === "preview",
    isProduction: environment === "production",
    enableDebugMode: environment !== "production",
    observability: getObservabilityConfig(),
  };
}

export const env = getEnvConfig();

export function getBaseUrl(): string {
  return env.apiUrl;
}
