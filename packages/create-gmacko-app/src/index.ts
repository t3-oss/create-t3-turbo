import { Command } from "commander";
import pc from "picocolors";
import validateNpmPackageName from "validate-npm-package-name";

import type { CliOptions, IntegrationConfig, LlmProvider } from "./types.js";
import { getDefaultOptions, runPrompts } from "./prompts.js";
import { scaffold } from "./scaffold.js";
import { DEFAULT_INTEGRATIONS, DEFAULT_LANDING_PAGE } from "./types.js";

const program = new Command();

program
  .name("create-gmacko-app")
  .description("Create a new Gmacko app with Next.js, Expo, tRPC, and more")
  .version("0.1.1")
  .argument("<app-name>", "Name of the app to create")
  .option("--yes, -y", "Accept all defaults without prompting")
  .option("--prune", "Remove unused integration packages")
  .option("--no-install", "Skip pnpm install")
  .option("--no-git", "Skip git init")
  .option("--no-ai", "Exclude AI workflow system")
  .option("--no-provision", "Exclude provisioning script")
  .option("--web", "Include Next.js web app (default: true)")
  .option("--no-web", "Exclude Next.js web app")
  .option("--mobile", "Include Expo mobile app (default: true)")
  .option("--no-mobile", "Exclude Expo mobile app")
  .option("--tanstack-start", "Include TanStack Start app")
  .option("--no-tanstack-start", "Exclude TanStack Start app (default)")
  .option(
    "--integrations <list>",
    "Comma-separated list of integrations (sentry,posthog,stripe,revenuecat,notifications,email,realtime,storage)",
  )
  .option("--email-provider <provider>", "Email provider (resend, sendgrid)")
  .option("--realtime-provider <provider>", "Realtime provider (pusher, ably)")
  .option("--storage-provider <provider>", "Storage provider (uploadthing)")
  .option("--package-scope <scope>", "Package scope (default: @gmacko)")
  .option(
    "--landing-llm <provider>",
    "Generate custom landing page with LLM (claude, codex, gemini)",
  )
  .option(
    "--landing-prompt <prompt>",
    "Product description for AI landing page generation",
  )
  .action(async (appName: string, opts: Record<string, unknown>) => {
    const validation = validateNpmPackageName(appName);
    if (!validation.validForNewPackages) {
      console.error(pc.red(`Invalid package name: ${appName}`));
      if (validation.errors) {
        validation.errors.forEach((err) => console.error(pc.red(`  - ${err}`)));
      }
      process.exit(1);
    }

    let options: CliOptions;

    if (opts.yes || opts.y) {
      options = getDefaultOptions(appName);
      options.prune = opts.prune === true;
      options.install = opts.install !== false;
      options.git = opts.git !== false;
      options.includeAi = opts.ai !== false;
      options.includeProvision = opts.provision !== false;

      if (opts.web !== undefined) options.platforms.web = opts.web === true;
      if (opts.mobile !== undefined)
        options.platforms.mobile = opts.mobile === true;
      if (opts.tanstackStart !== undefined)
        options.platforms.tanstackStart = opts.tanstackStart === true;
      if (opts.packageScope) options.packageScope = opts.packageScope as string;
      if (opts.integrations !== undefined) {
        options.integrations = parseIntegrations(
          opts.integrations as string,
          opts.emailProvider as string | undefined,
          opts.realtimeProvider as string | undefined,
          opts.storageProvider as string | undefined,
        );
      }

      // Landing page generation via CLI flags
      if (opts.landingLlm) {
        options.landingPage = {
          generate: true,
          provider: opts.landingLlm as LlmProvider,
          prompt: (opts.landingPrompt as string) ?? "",
        };
      }
    } else {
      options = await runPrompts(appName, {
        packageScope: opts.packageScope as string | undefined,
      });
      if (opts.prune !== undefined) options.prune = opts.prune === true;
      if (opts.install !== undefined) options.install = opts.install !== false;
      if (opts.git !== undefined) options.git = opts.git !== false;
    }

    await scaffold(options);
  });

function parseIntegrations(
  list: string,
  emailProvider?: string,
  realtimeProvider?: string,
  storageProvider?: string,
): IntegrationConfig {
  const items = list.split(",").map((s) => s.trim().toLowerCase());
  const set = new Set(items);

  return {
    sentry: set.has("sentry"),
    posthog: set.has("posthog"),
    stripe: set.has("stripe"),
    revenuecat: set.has("revenuecat"),
    notifications: set.has("notifications"),
    email: {
      enabled: set.has("email"),
      provider: set.has("email")
        ? ((emailProvider as "resend" | "sendgrid") ?? "resend")
        : "none",
    },
    realtime: {
      enabled: set.has("realtime"),
      provider: set.has("realtime")
        ? ((realtimeProvider as "pusher" | "ably") ?? "pusher")
        : "none",
    },
    storage: {
      enabled: set.has("storage"),
      provider: set.has("storage") ? "uploadthing" : "none",
    },
  };
}

program.parse();
