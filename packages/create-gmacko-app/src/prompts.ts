import * as p from "@clack/prompts";
import pc from "picocolors";

import type {
  CliOptions,
  IntegrationConfig,
  IntegrationPreset,
} from "./types.js";
import {
  CORE_INTEGRATIONS,
  DEFAULT_INTEGRATIONS,
  EVERYTHING_INTEGRATIONS,
} from "./types.js";

function toTitleCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function runPrompts(
  appName: string,
  defaults: Partial<CliOptions> = {},
): Promise<CliOptions> {
  p.intro(pc.bgCyan(pc.black(" create-gmacko-app ")));

  const displayName = await p.text({
    message: "What is your app display name?",
    placeholder: toTitleCase(appName),
    defaultValue: toTitleCase(appName),
    validate: (value) => {
      if (value === undefined) return "Display name is required";
      if (value.length === 0) return "Display name is required";
      if (value.length > 50)
        return "Display name must be 50 characters or less";
    },
  });

  if (p.isCancel(displayName)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const platforms = await p.multiselect({
    message: "Which platforms?",
    options: [
      { value: "web", label: "Web (Next.js)", hint: "recommended" },
      { value: "mobile", label: "Mobile (Expo)", hint: "recommended" },
      { value: "tanstackStart", label: "TanStack Start", hint: "experimental" },
    ],
    initialValues: ["web", "mobile"],
    required: true,
  });

  if (p.isCancel(platforms)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const packageScope = await p.text({
    message: "Package scope for workspace packages?",
    placeholder: "@gmacko",
    defaultValue: defaults.packageScope ?? "@gmacko",
    validate: (value) => {
      if (value === undefined) return "Scope must start with @";
      if (!value.startsWith("@")) return "Scope must start with @";
      if (value.includes(" ")) return "Scope cannot contain spaces";
    },
  });

  if (p.isCancel(packageScope)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const integrationPreset = (await p.select({
    message: "Choose an integration preset",
    options: [
      {
        value: "core",
        label: "Core only",
        hint: "No optional integrations",
      },
      {
        value: "recommended",
        label: "Recommended",
        hint: "Sentry + PostHog",
      },
      {
        value: "everything",
        label: "Everything",
        hint: "All integrations enabled",
      },
      {
        value: "custom",
        label: "Custom",
        hint: "Choose individually",
      },
    ],
    initialValue: "recommended",
  })) as IntegrationPreset;

  if (p.isCancel(integrationPreset)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  let integrations: IntegrationConfig;

  if (integrationPreset === "core") {
    integrations = CORE_INTEGRATIONS;
  } else if (integrationPreset === "recommended") {
    integrations = DEFAULT_INTEGRATIONS;
  } else if (integrationPreset === "everything") {
    integrations = EVERYTHING_INTEGRATIONS;
  } else {
    integrations = await promptCustomIntegrations();
  }

  if (integrationPreset !== "custom") {
    const forgegraph = await p.confirm({
      message:
        "Enable ForgeGraph integrations (health endpoint, structured logging, OTEL)?",
      initialValue: true,
    });
    if (p.isCancel(forgegraph)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    integrations = { ...integrations, forgegraph: forgegraph as boolean };
  }

  const saasLayers = await promptSaasLayers();

  const includeAi = await p.confirm({
    message: "Include Gmacko AI workflow system?",
    initialValue: true,
  });

  if (p.isCancel(includeAi)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const saasBootstrap =
    includeAi === true
      ? await p.confirm({
          message:
            "Add the optional Claude SaaS bootstrap pack (office-hours -> autoplan -> design-consultation + local follow-up skills)?",
          initialValue: false,
        })
      : false;

  if (p.isCancel(saasBootstrap)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const includeProvision = await p.confirm({
    message: "Include provisioning script?",
    initialValue: true,
  });

  if (p.isCancel(includeProvision)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const prune = await p.confirm({
    message: "Prune unused integrations from the repo?",
    initialValue: false,
  });

  if (p.isCancel(prune)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const install = await p.confirm({
    message: "Run pnpm install?",
    initialValue: true,
  });

  if (p.isCancel(install)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const git = await p.confirm({
    message: "Initialize a git repository?",
    initialValue: true,
  });

  if (p.isCancel(git)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return {
    appName,
    displayName: displayName as string,
    packageScope: packageScope as string,
    platforms: {
      web: (platforms as string[]).includes("web"),
      mobile: (platforms as string[]).includes("mobile"),
      tanstackStart: (platforms as string[]).includes("tanstackStart"),
    },
    saasCollaboration: saasLayers.collaboration,
    saasBilling: saasLayers.billing,
    saasMetering: saasLayers.metering,
    saasSupport: saasLayers.support,
    saasLaunch: saasLayers.launch,
    saasReferrals: saasLayers.referrals,
    saasOperatorApis: saasLayers.operatorApis,
    vinext: false,
    saasBootstrap: saasBootstrap as boolean,
    trpcOperators: saasLayers.operatorApis,
    forgegraphServer: "https://forge.example.com",
    forgegraphStagingNode: "change-me-staging-node",
    forgegraphProductionNode: "change-me-production-node",
    forgegraphPreviewDomain: "change-me.preview.example.com",
    forgegraphProductionDomain: "change-me.example.com",
    integrations: { ...integrations },
    includeAi: includeAi as boolean,
    includeProvision: includeProvision as boolean,
    prune: prune as boolean,
    install: install as boolean,
    git: git as boolean,
  };
}

async function promptSaasLayers(): Promise<{
  collaboration: boolean;
  billing: boolean;
  metering: boolean;
  support: boolean;
  launch: boolean;
  referrals: boolean;
  operatorApis: boolean;
}> {
  const collaboration = await p.confirm({
    message: "Add collaboration layers (members and invites)?",
    initialValue: false,
  });
  if (p.isCancel(collaboration)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const billing = await p.confirm({
    message: "Add billing and plans?",
    initialValue: false,
  });
  if (p.isCancel(billing)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const metering = await p.confirm({
    message: "Add metering and usage rollups?",
    initialValue: false,
  });
  if (p.isCancel(metering)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const support = await p.confirm({
    message: "Add support surfaces (contact, tickets, FAQ, changelog)?",
    initialValue: false,
  });
  if (p.isCancel(support)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const launch = await p.confirm({
    message: "Add launch controls (maintenance, signup, allowlists, waitlist)?",
    initialValue: false,
  });
  if (p.isCancel(launch)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const referrals = await p.confirm({
    message: "Add referral and invite growth tools?",
    initialValue: false,
  });
  if (p.isCancel(referrals)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const operatorApis = await p.confirm({
    message: "Add operator APIs (shared CLI + MCP wrappers over the API)?",
    initialValue: false,
  });
  if (p.isCancel(operatorApis)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  return {
    collaboration: collaboration as boolean,
    billing: billing as boolean,
    metering: metering as boolean,
    support: support as boolean,
    launch: launch as boolean,
    referrals: referrals as boolean,
    operatorApis: operatorApis as boolean,
  };
}

async function promptCustomIntegrations(): Promise<IntegrationConfig> {
  const selected = await p.multiselect({
    message: "Enable integrations",
    options: [
      { value: "sentry", label: "Sentry (monitoring)", hint: "recommended" },
      { value: "posthog", label: "PostHog (analytics)", hint: "recommended" },
      {
        value: "forgegraph",
        label: "ForgeGraph (health, logging, OTEL)",
        hint: "recommended",
      },
      { value: "stripe", label: "Stripe (payments)", hint: "web" },
      { value: "revenuecat", label: "RevenueCat (mobile IAP)", hint: "mobile" },
      { value: "notifications", label: "Push Notifications", hint: "mobile" },
      { value: "email", label: "Email" },
      {
        value: "realtime",
        label: "Realtime + Jobs (Redis + BullMQ)",
      },
      { value: "storage", label: "Storage" },
    ],
    initialValues: ["sentry", "posthog", "forgegraph"],
    required: false,
  });

  if (p.isCancel(selected)) {
    p.cancel("Operation cancelled.");
    process.exit(0);
  }

  const selectedSet = new Set(selected as string[]);

  let emailProvider: "resend" | "sendgrid" | "none" = "none";
  if (selectedSet.has("email")) {
    const provider = await p.select({
      message: "Email provider?",
      options: [
        { value: "resend", label: "Resend" },
        { value: "sendgrid", label: "SendGrid" },
      ],
      initialValue: "resend",
    });
    if (p.isCancel(provider)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    emailProvider = provider as "resend" | "sendgrid";
  }

  let storageProvider: "uploadthing" | "none" = "none";
  if (selectedSet.has("storage")) {
    storageProvider = "uploadthing";
  }

  return {
    sentry: selectedSet.has("sentry"),
    posthog: selectedSet.has("posthog"),
    forgegraph: selectedSet.has("forgegraph"),
    stripe: selectedSet.has("stripe"),
    revenuecat: selectedSet.has("revenuecat"),
    notifications: selectedSet.has("notifications"),
    email: { enabled: selectedSet.has("email"), provider: emailProvider },
    realtime: {
      enabled: selectedSet.has("realtime"),
      provider: selectedSet.has("realtime") ? "redis" : "none",
    },
    storage: { enabled: selectedSet.has("storage"), provider: storageProvider },
  };
}

export function getDefaultOptions(appName: string): CliOptions {
  return {
    appName,
    displayName: toTitleCase(appName),
    packageScope: "@gmacko",
    platforms: {
      web: true,
      mobile: true,
      tanstackStart: false,
    },
    saasCollaboration: false,
    saasBilling: false,
    saasMetering: false,
    saasSupport: false,
    saasLaunch: false,
    saasReferrals: false,
    saasOperatorApis: false,
    vinext: false,
    saasBootstrap: false,
    trpcOperators: false,
    forgegraphServer: "https://forge.example.com",
    forgegraphStagingNode: "change-me-staging-node",
    forgegraphProductionNode: "change-me-production-node",
    forgegraphPreviewDomain: "change-me.preview.example.com",
    forgegraphProductionDomain: "change-me.example.com",
    integrations: DEFAULT_INTEGRATIONS,
    includeAi: true,
    includeProvision: true,
    prune: false,
    install: true,
    git: true,
  };
}
