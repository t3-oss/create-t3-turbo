import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";

import { PostHogNativeProvider } from "@gmacko/analytics/native";
import { integrations } from "@gmacko/config";
import en from "@gmacko/i18n/messages/en.json";
import es from "@gmacko/i18n/messages/es.json";
import { I18nNativeProvider } from "@gmacko/i18n/native";
import { initSentryNative } from "@gmacko/monitoring/native";
import { initRevenueCat } from "@gmacko/purchases";

import { env } from "./config/env";
import { getStoredLocale } from "./utils/i18n";

interface ProvidersProps {
  children: ReactNode;
}

const resources = {
  en: { translation: en },
  es: { translation: es },
} as const;

export function Providers({ children }: ProvidersProps) {
  const [initialLocale] = useState(getStoredLocale);

  useEffect(() => {
    void initializeServices();
  }, []);

  const content = (
    <I18nNativeProvider resources={resources} initialLocale={initialLocale}>
      {children}
    </I18nNativeProvider>
  );

  if (integrations.posthog && env.observability.posthogKey) {
    return (
      <PostHogNativeProvider
        apiKey={env.observability.posthogKey}
        apiHost={env.observability.posthogHost}
      >
        {content}
      </PostHogNativeProvider>
    );
  }

  return content;
}

/**
 * Initialize all services in the correct order.
 *
 * Order matters:
 * 1. Sentry (error monitoring — first so it captures init errors)
 * 2. ATT prompt (iOS only — must be before any tracking SDK)
 * 3. RevenueCat (in-app purchases)
 *
 * PostHog is initialized via the PostHogNativeProvider above.
 */
async function initializeServices() {
  // 1. Sentry
  if (integrations.sentry && env.observability.sentryDsn) {
    initSentryNative({
      dsn: env.observability.sentryDsn,
      environment: env.environment,
      debug: env.enableDebugMode,
      tracesSampleRate: env.isProduction ? 0.1 : 1.0,
    });
  }

  // 2. ATT (App Tracking Transparency) — iOS only
  // Must be called BEFORE initializing analytics SDKs.
  // The native dialog is shown by the useTrackingTransparency hook in the app,
  // but we ensure the framework is loaded here.
  if (Platform.OS === "ios") {
    try {
      // Dynamic import so Android doesn't try to load the iOS-only module
      const { getTrackingPermissionsAsync } = await import(
        "expo-tracking-transparency"
      );
      await getTrackingPermissionsAsync();
    } catch {
      // ATT not available (older iOS or simulator)
    }
  }

  // 3. RevenueCat
  if (integrations.revenuecat) {
    const apiKey =
      Platform.OS === "ios"
        ? (Constants.expoConfig?.extra?.REVENUECAT_API_KEY_IOS as
            | string
            | undefined)
        : (Constants.expoConfig?.extra?.REVENUECAT_API_KEY_ANDROID as
            | string
            | undefined);

    if (apiKey) {
      await initRevenueCat({ apiKey });
    }
  }
}
