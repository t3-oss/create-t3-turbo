export interface IntegrationConfig {
  sentry: boolean;
  posthog: boolean;
  forgegraph: boolean;
  stripe: boolean;
  revenuecat: boolean;
  notifications: boolean;
  email: { enabled: boolean; provider: "resend" | "sendgrid" | "none" };
  realtime: { enabled: boolean; provider: "redis" | "none" };
  storage: { enabled: boolean; provider: "uploadthing" | "none" };
}

export interface PlatformConfig {
  web: boolean;
  mobile: boolean;
  tanstackStart: boolean;
}

export interface CliOptions {
  appName: string;
  displayName: string;
  packageScope: string;
  platforms: PlatformConfig;
  saasCollaboration: boolean;
  saasBilling: boolean;
  saasMetering: boolean;
  saasSupport: boolean;
  saasLaunch: boolean;
  saasReferrals: boolean;
  saasOperatorApis: boolean;
  vinext: boolean;
  saasBootstrap: boolean;
  trpcOperators: boolean;
  forgegraphServer: string;
  forgegraphStagingNode: string;
  forgegraphProductionNode: string;
  forgegraphPreviewDomain: string;
  forgegraphProductionDomain: string;
  integrations: IntegrationConfig;
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
  forgegraph: true,
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
  forgegraph: false,
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
  forgegraph: true,
  stripe: true,
  revenuecat: true,
  notifications: true,
  email: { enabled: true, provider: "resend" },
  realtime: { enabled: true, provider: "redis" },
  storage: { enabled: true, provider: "uploadthing" },
};
