export interface IntegrationConfig {
  sentry: boolean;
  posthog: boolean;
  stripe: boolean;
  revenuecat: boolean;
  notifications: boolean;
  email: { enabled: boolean; provider: "resend" | "sendgrid" | "none" };
  realtime: { enabled: boolean; provider: "pusher" | "ably" | "none" };
  storage: { enabled: boolean; provider: "uploadthing" | "none" };
}

export interface PlatformConfig {
  web: boolean;
  mobile: boolean;
  tanstackStart: boolean;
}

export type LlmProvider = "claude" | "codex" | "gemini" | "none";

export interface LandingPageConfig {
  /** Whether to generate a custom landing page using an LLM */
  generate: boolean;
  /** Which LLM to use for generation */
  provider: LlmProvider;
  /** User prompt describing the product / desired landing page */
  prompt: string;
}

export interface CliOptions {
  appName: string;
  displayName: string;
  packageScope: string;
  platforms: PlatformConfig;
  integrations: IntegrationConfig;
  landingPage: LandingPageConfig;
  includeAi: boolean;
  includeProvision: boolean;
  prune: boolean;
  install: boolean;
  git: boolean;
}

export type IntegrationPreset =
  | "core"
  | "recommended"
  | "everything"
  | "custom";

export const DEFAULT_INTEGRATIONS: IntegrationConfig = {
  sentry: true,
  posthog: true,
  stripe: false,
  revenuecat: false,
  notifications: false,
  email: { enabled: false, provider: "none" },
  realtime: { enabled: false, provider: "none" },
  storage: { enabled: false, provider: "none" },
};

export const CORE_INTEGRATIONS: IntegrationConfig = {
  sentry: false,
  posthog: false,
  stripe: false,
  revenuecat: false,
  notifications: false,
  email: { enabled: false, provider: "none" },
  realtime: { enabled: false, provider: "none" },
  storage: { enabled: false, provider: "none" },
};

export const EVERYTHING_INTEGRATIONS: IntegrationConfig = {
  sentry: true,
  posthog: true,
  stripe: true,
  revenuecat: true,
  notifications: true,
  email: { enabled: true, provider: "resend" },
  realtime: { enabled: true, provider: "pusher" },
  storage: { enabled: true, provider: "uploadthing" },
};

export const DEFAULT_LANDING_PAGE: LandingPageConfig = {
  generate: false,
  provider: "none",
  prompt: "",
};
