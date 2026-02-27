export const integrations = {
  // Monitoring & Analytics (default ON)
  sentry: true,
  posthog: true,

  // Payments - Web (default OFF)
  stripe: false,

  // Payments - Mobile (default OFF)
  revenuecat: false,

  // Push Notifications (default OFF)
  notifications: false,

  // Communication (default OFF)
  email: {
    enabled: false,
    provider: "none" as "resend" | "sendgrid" | "none",
  },

  // Realtime (default OFF)
  realtime: {
    enabled: false,
    provider: "none" as "pusher" | "ably" | "none",
  },

  // Storage (default OFF)
  storage: {
    enabled: false,
    provider: "none" as "uploadthing" | "none",
  },

  // Internationalization (default OFF)
  i18n: true,

  // OpenAPI documentation (default OFF)
  openapi: false,

  // WebSocket server (default OFF)
  websocket: false,

  // gRPC services (default OFF)
  grpc: false,

  // Caching layer — Redis in production, in-memory in dev (default OFF)
  cache: false,

  // Maintenance mode — redirects all traffic to /maintenance (default OFF)
  maintenance: false,
} as const;

export type Integrations = typeof integrations;

export const isSentryEnabled = () => integrations.sentry;
export const isPostHogEnabled = () => integrations.posthog;
export const isStripeEnabled = () => integrations.stripe;
export const isRevenueCatEnabled = () => integrations.revenuecat;
export const isNotificationsEnabled = () => integrations.notifications;
export const isEmailEnabled = () => integrations.email.enabled;
export const isRealtimeEnabled = () => integrations.realtime.enabled;
export const isStorageEnabled = () => integrations.storage.enabled;
export const isI18nEnabled = () => integrations.i18n;
export const isOpenApiEnabled = () => integrations.openapi;
export const isWebSocketEnabled = () => integrations.websocket;
export const isGrpcEnabled = () => integrations.grpc;
export const isCacheEnabled = () => integrations.cache;
export const isMaintenanceEnabled = () => integrations.maintenance;
