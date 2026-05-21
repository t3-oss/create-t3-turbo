import { execSync } from "node:child_process";
import path from "node:path";
import * as p from "@clack/prompts";
import fs from "fs-extra";
import pc from "picocolors";
import { runProvisioning } from "./provision.js";
import type { CliOptions, IntegrationConfig } from "./types.js";

const TEMPLATE_REPO =
  process.env.CREATE_GMACKO_APP_TEMPLATE_REPO ??
  "https://github.com/gmackorg/create-gmacko-app.git";

export async function scaffold(options: CliOptions): Promise<void> {
  const targetDir = path.resolve(process.cwd(), options.appName);

  if (fs.existsSync(targetDir)) {
    const files = fs.readdirSync(targetDir);
    if (files.length > 0) {
      p.log.error(
        `Directory ${pc.cyan(options.appName)} already exists and is not empty.`,
      );
      process.exit(1);
    }
  }

  const spinner = p.spinner();

  spinner.start("Cloning template...");
  try {
    if (isLocalTemplatePath(TEMPLATE_REPO)) {
      fs.copySync(TEMPLATE_REPO, targetDir, {
        filter: (src) => shouldCopyTemplatePath(src, TEMPLATE_REPO),
      });
    } else {
      execSync(`git clone --depth 1 ${TEMPLATE_REPO} "${targetDir}"`, {
        stdio: "pipe",
      });
      fs.removeSync(path.join(targetDir, ".git"));
    }

    spinner.stop("Template cloned");
  } catch {
    spinner.stop("Failed to clone template");
    p.log.error("Failed to clone template repository");
    process.exit(1);
  }

  spinner.start("Configuring project...");

  updatePackageJson(targetDir, options);
  updateIntegrationsConfig(targetDir, options, options.integrations);
  updatePackageScope(targetDir, options.packageScope);
  createManifest(targetDir, options);
  createForgeGraphConfig(targetDir, options);
  addForgeGraphScripts(targetDir);
  addOptionalOperatorScripts(targetDir, options);
  customizeMcpConfig(targetDir, options);
  customizeClaudeInstructions(targetDir, options);
  customizeBootstrapPlaybook(targetDir, options);

  if (!options.platforms.web) {
    fs.removeSync(path.join(targetDir, "apps/nextjs"));
  }
  if (!options.platforms.mobile) {
    fs.removeSync(path.join(targetDir, "apps/expo"));
  }
  if (!options.platforms.tanstackStart) {
    fs.removeSync(path.join(targetDir, "apps/tanstack-start"));
  }

  if (options.platforms.web && options.vinext) {
    configureVinext(targetDir);
  }

  if (options.platforms.mobile) {
    configureExpoApp(targetDir, options.appName, options.displayName);
  }

  customizeGeneratedReadme(targetDir, options);
  pruneOptionalLanes(targetDir, options);

  if (!options.includeAi) {
    fs.removeSync(path.join(targetDir, ".claude"));
    fs.removeSync(path.join(targetDir, ".opencode"));
    fs.removeSync(path.join(targetDir, "CLAUDE.md"));
    fs.removeSync(path.join(targetDir, "DESIGN.md"));
    fs.removeSync(path.join(targetDir, "docs/ai"));
    fs.removeSync(path.join(targetDir, "opencode.json"));
  }

  if (!options.includeProvision) {
    fs.removeSync(path.join(targetDir, "scripts/provision.sh"));
  }

  if (options.prune) {
    pruneIntegrations(targetDir, options.integrations);
  }

  spinner.stop("Project configured");

  if (options.git) {
    spinner.start("Initializing repository...");
    initializeRepository(targetDir, spinner);
  }

  if (options.install) {
    spinner.start("Installing dependencies...");
    try {
      execSync("pnpm install", { cwd: targetDir, stdio: "pipe" });
      spinner.stop("Dependencies installed");
    } catch {
      spinner.stop("Failed to install dependencies");
      p.log.warn("Run 'pnpm install' manually to complete setup");
    }
  }

  p.outro(pc.green("Scaffolding complete!"));

  // Skip provisioning prompt in CI or non-interactive environments
  const isInteractive = process.stdout.isTTY && !process.env.CI;

  if (isInteractive) {
    const shouldProvision = await p.confirm({
      message: "Would you like to set up cloud services now?",
      initialValue: true,
    });

    if (!p.isCancel(shouldProvision) && shouldProvision) {
      await runProvisioning({
        projectPath: targetDir,
        appName: options.appName,
        platforms: {
          web: options.platforms.web,
          mobile: options.platforms.mobile,
        },
      });
    }
  }

  console.log(`
  ${pc.bold("Next steps:")}

  ${pc.cyan("cd")} ${options.appName}
  ${pc.cyan("pnpm")} bootstrap:local
  ${pc.dim("# Update .forgegraph.yaml with your real server, domains, and nodes")}
  ${pc.cyan("pnpm")} forge:doctor
  ${pc.cyan("pnpm")} check:fast
  ${pc.cyan("pnpm")} dev
`);
}

function initializeRepository(
  targetDir: string,
  spinner: ReturnType<typeof p.spinner>,
): void {
  try {
    execSync("jj git init .", { cwd: targetDir, stdio: "pipe" });
    spinner.stop("Repository initialized with jj");
    return;
  } catch {
    p.log.warn("jj was unavailable; falling back to a plain Git repo.");
  }

  try {
    execSync("git init", { cwd: targetDir, stdio: "pipe" });
    spinner.stop("Repository initialized with git");
  } catch {
    spinner.stop("Failed to initialize repository");
  }
}

function updatePackageJson(targetDir: string, options: CliOptions): void {
  const pkgPath = path.join(targetDir, "package.json");
  const pkg = fs.readJsonSync(pkgPath);
  pkg.name = options.appName;
  fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });
}

function updateIntegrationsConfig(
  targetDir: string,
  options: CliOptions,
  integrations: IntegrationConfig,
): void {
  const configPath = path.join(
    targetDir,
    "packages/config/src/integrations.ts",
  );

  const content = `export const integrations = {
  sentry: ${integrations.sentry},
  posthog: ${integrations.posthog},
  forgegraph: ${integrations.forgegraph},
  stripe: ${integrations.stripe},
  revenuecat: ${integrations.revenuecat},
  notifications: ${integrations.notifications},
  email: {
    enabled: ${integrations.email.enabled},
    provider: "${integrations.email.provider}" as "resend" | "sendgrid" | "none",
  },
  realtime: {
    enabled: ${integrations.realtime.enabled},
    provider: "${integrations.realtime.provider}" as "redis" | "none",
  },
  storage: {
    enabled: ${integrations.storage.enabled},
    provider: "${integrations.storage.provider}" as "uploadthing" | "none",
  },
  i18n: false,
  openapi: false,
} as const;

export type Integrations = typeof integrations;

export const saasFeatures = {
  collaboration: ${options.saasCollaboration},
  billing: ${options.saasBilling},
  metering: ${options.saasMetering},
  support: ${options.saasSupport},
  launch: ${options.saasLaunch},
  referrals: ${options.saasReferrals},
  operatorApis: ${options.saasOperatorApis},
} as const;

export type SaasFeatures = typeof saasFeatures;

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
export const isForgeGraphEnabled = () => integrations.forgegraph;
export const isSaasCollaborationEnabled = () => saasFeatures.collaboration;
export const isSaasBillingEnabled = () => saasFeatures.billing;
export const isSaasMeteringEnabled = () => saasFeatures.metering;
export const isSaasSupportEnabled = () => saasFeatures.support;
export const isSaasLaunchEnabled = () => saasFeatures.launch;
export const isSaasReferralsEnabled = () => saasFeatures.referrals;
export const isSaasOperatorApisEnabled = () => saasFeatures.operatorApis;
`;

  fs.writeFileSync(configPath, content);
}

function updatePackageScope(targetDir: string, scope: string): void {
  if (scope === "@gmacko") return;

  const files = getAllFiles(targetDir);

  for (const file of files) {
    if (
      file.endsWith(".json") ||
      file.endsWith(".ts") ||
      file.endsWith(".tsx") ||
      file.endsWith(".js") ||
      file.endsWith(".mjs")
    ) {
      try {
        let content = fs.readFileSync(file, "utf-8");
        if (content.includes("@gmacko/")) {
          content = content.replace(/@gmacko\//g, `${scope}/`);
          fs.writeFileSync(file, content);
        }
      } catch {
        // Skip files that can't be read
      }
    }
  }
}

function createManifest(targetDir: string, options: CliOptions): void {
  const manifest = {
    preset:
      options.integrations.sentry && options.integrations.posthog
        ? "recommended"
        : "custom",
    integrations: options.integrations,
    platforms: options.platforms,
    scaffoldedAt: new Date().toISOString(),
    packageScope: options.packageScope,
  };

  fs.writeJsonSync(path.join(targetDir, "gmacko.integrations.json"), manifest, {
    spaces: 2,
  });
}

function customizeGeneratedReadme(
  targetDir: string,
  options: CliOptions,
): void {
  const readmePath = path.join(targetDir, "README.md");
  const startMarker = "<!-- SCAFFOLD_PROFILE_START -->";
  const endMarker = "<!-- SCAFFOLD_PROFILE_END -->";

  if (!fs.existsSync(readmePath)) {
    return;
  }

  const readme = fs.readFileSync(readmePath, "utf8");
  const profileBlock = buildScaffoldProfileBlock(options);
  const agentQuickstartBlock = options.includeAi
    ? `\n\n${buildAgentQuickstartBlock()}`
    : "";
  const saasBootstrapBlock =
    options.includeAi && options.saasBootstrap
      ? `\n\n${buildSaasBootstrapBlock(options)}`
      : "";
  const trpcOperatorsBlock = options.trpcOperators
    ? `\n\n${buildTrpcOperatorsBlock()}`
    : "";
  const startIndex = readme.indexOf(startMarker);
  const endIndex = readme.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return;
  }

  const updatedReadme =
    readme.slice(0, startIndex) +
    profileBlock +
    agentQuickstartBlock +
    saasBootstrapBlock +
    trpcOperatorsBlock +
    readme.slice(endIndex + endMarker.length);

  fs.writeFileSync(readmePath, updatedReadme);
}

function buildAgentQuickstartBlock(): string {
  return `## Agent quickstart

- Read \`AGENTS.md\` first for the shared repo rules.
- Use \`.mcp.json\` for the repo MCP server setup.
- Claude Code users should check \`.claude/settings.json\`.
- OpenCode users should check \`opencode.json\`.
`;
}

function buildSaasBootstrapBlock(options: CliOptions): string {
  return buildSaasBootstrapContent(options, true);
}

function buildSaasBootstrapContent(
  options: CliOptions,
  includeSummaryLink: boolean,
): string {
  const { claudeLines, codexLines, opencodeLines, selectedLayerLines } =
    getBootstrapRecommendations(options);

  const summaryLink = includeSummaryLink
    ? `
- Use [docs/ai/BOOTSTRAP_PLAYBOOK.md](docs/ai/BOOTSTRAP_PLAYBOOK.md) for the full handoff.`
    : "";

  const selectedLayerSection =
    selectedLayerLines.length > 0
      ? `
## Selected SaaS layers

${selectedLayerLines.join("\n")}
`
      : "";

  return `# Post-setup SaaS bootstrap

Run this after \`pnpm bootstrap:local\`.

## Claude-only

${claudeLines.join("\n")}

## Codex

${codexLines.join("\n")}

## OpenCode

${opencodeLines.join("\n")}${selectedLayerSection}${summaryLink}
`;
}

function getBootstrapRecommendations(options: CliOptions): {
  claudeLines: string[];
  codexLines: string[];
  opencodeLines: string[];
  selectedLayerLines: string[];
} {
  const claudeLines = [
    "- Claude-only: run `/office-hours` to force clarity on customer, problem, and wedge.",
    "- Claude-only: if your user-level gstack install includes `/autoplan`, run it next.",
    "- Claude-only: run `/design-consultation` once the product direction is clear so `DESIGN.md` becomes the visual source of truth.",
  ];
  const codexLines = [
    "- Start from `AGENTS.md` and `docs/ai/IMPLEMENTATION_PLAN.md`.",
    "- Run `pnpm bootstrap:local`, then `pnpm doctor` and `pnpm check:fast`.",
  ];
  const opencodeLines = [
    "- Start from `AGENTS.md`, `opencode.json`, and `docs/ai/IMPLEMENTATION_PLAN.md`.",
    "- Run `pnpm bootstrap:local`, then `pnpm doctor` and `pnpm check:fast`.",
  ];
  const selectedLayerLines: string[] = [];

  if (options.saasCollaboration) {
    selectedLayerLines.push(
      "- Collaboration: use `packages/db/src/schema.ts` and `packages/api/src/router/settings.ts` for workspace membership and invites.",
    );
    codexLines.push(
      "- Collaboration: inspect `packages/db/src/schema.ts` and `packages/api/src/router/settings.ts` for workspace membership and invites.",
    );
    opencodeLines.push(
      "- Collaboration: inspect `packages/db/src/schema.ts` and `packages/api/src/router/settings.ts` for workspace membership and invites.",
    );
  }

  if (options.saasBilling || options.saasMetering) {
    selectedLayerLines.push(
      "- Billing and metering: use `packages/billing` and `packages/api/src/router/settings.ts` for plan shape, limits, and usage rollups.",
    );
    codexLines.push(
      "- Billing and metering: use `packages/billing` and `packages/api/src/router/settings.ts` for plans, limits, and usage rollups.",
    );
    opencodeLines.push(
      "- Billing and metering: use `packages/billing` and `packages/api/src/router/settings.ts` for plans, limits, and usage rollups.",
    );
    claudeLines.push(
      "- Claude-only: run `/setup-stripe-billing` once the workspace, plan, and usage model are clear.",
    );
  }

  if (options.saasSupport || options.saasLaunch) {
    selectedLayerLines.push(
      "- Support and launch: use `apps/nextjs/src/app`, `packages/api/src/router/admin.ts`, and `packages/api/src/router/settings.ts` for landing, contact, FAQ, changelog, maintenance mode, signup toggles, and waitlist review.",
    );
    codexLines.push(
      "- Support and launch: use `apps/nextjs/src/app`, `packages/api/src/router/admin.ts`, and `packages/api/src/router/settings.ts` for landing, contact, FAQ, changelog, maintenance mode, signup toggles, and waitlist review.",
    );
    opencodeLines.push(
      "- Support and launch: use `apps/nextjs/src/app`, `packages/api/src/router/admin.ts`, and `packages/api/src/router/settings.ts` for landing, contact, FAQ, changelog, maintenance mode, signup toggles, and waitlist review.",
    );
    claudeLines.push(
      "- Claude-only: run `/launch-landing-page` once the public shell and support flow are ready to shape.",
    );
  }

  if (options.saasReferrals) {
    selectedLayerLines.push(
      "- Referrals: keep referral capture and invite growth tied to the landing page and admin review tools.",
    );
    codexLines.push(
      "- Referrals: keep referral capture and invite growth tied to the landing page and admin review tools in `packages/api/src/router/admin.ts`.",
    );
    opencodeLines.push(
      "- Referrals: keep referral capture and invite growth tied to the landing page and admin review tools in `packages/api/src/router/admin.ts`.",
    );
  }

  if (options.saasOperatorApis || options.trpcOperators) {
    selectedLayerLines.push(
      "- Operator APIs: use `pnpm trpc:ops -- --help` and `pnpm mcp:app` for the shared CLI and MCP wrapper lane.",
    );
    codexLines.push(
      "- Operator APIs: use `packages/operator-core`, `packages/trpc-cli`, and `packages/mcp-server` for the shared CLI and MCP wrapper lane.",
    );
    opencodeLines.push(
      "- Operator APIs: use `packages/operator-core`, `packages/trpc-cli`, and `packages/mcp-server` for the shared CLI and MCP wrapper lane.",
    );
  }

  if (options.platforms.mobile) {
    claudeLines.push(
      "- Claude-only: use `/bootstrap-expo-app` and `/test-mobile-with-maestro` for the Expo lane.",
    );
    codexLines.push(
      "- Mobile: use `apps/expo` and the mobile QA checklist to complete the Expo baseline.",
    );
    opencodeLines.push(
      "- Mobile: use `apps/expo` and the mobile QA checklist to complete the Expo baseline.",
    );
  }

  return { claudeLines, codexLines, opencodeLines, selectedLayerLines };
}

function customizeBootstrapPlaybook(
  targetDir: string,
  options: CliOptions,
): void {
  if (!options.includeAi || !options.saasBootstrap) {
    return;
  }

  const playbookPath = path.join(targetDir, "docs/ai/BOOTSTRAP_PLAYBOOK.md");
  if (!fs.existsSync(playbookPath)) {
    return;
  }

  fs.writeFileSync(playbookPath, buildSaasBootstrapContent(options, false));
}

function buildTrpcOperatorsBlock(): string {
  return `## Operator lane

- This scaffold includes CLI + MCP wrappers over the same tRPC API.
- Use \`pnpm trpc:ops -- --help\` for the terminal operator surface.
- Start with \`pnpm trpc:ops -- auth_help\` for login guidance.
- Use \`pnpm trpc:ops -- get_workspace_context\` to inspect the current workspace.
- Use \`pnpm trpc:ops -- list_api_keys\` and \`pnpm trpc:ops -- create_api_key --name automation\` for automation credentials.
- Use \`pnpm trpc:ops -- get_billing_overview\` for usage and limits.
- Use \`pnpm mcp:app\` to run the local MCP server. \`auth_help\` works without an API key; protected tools require \`GMACKO_API_KEY\`.
`;
}

function buildScaffoldProfileBlock(options: CliOptions): string {
  const platforms = [
    options.platforms.web ? "Next.js" : null,
    options.platforms.mobile ? "Expo" : null,
    options.platforms.tanstackStart ? "TanStack Start" : null,
  ].filter(Boolean);

  const integrations = [
    options.integrations.sentry ? "Sentry" : null,
    options.integrations.posthog ? "PostHog" : null,
    options.integrations.stripe ? "Stripe" : null,
    options.integrations.revenuecat ? "RevenueCat" : null,
    options.integrations.notifications ? "Push notifications" : null,
    options.integrations.email.enabled
      ? `Email (${options.integrations.email.provider})`
      : null,
    options.integrations.forgegraph
      ? "ForgeGraph (health, logging, OTEL)"
      : null,
    options.integrations.realtime.enabled
      ? "Realtime + Jobs (Redis + BullMQ)"
      : null,
    options.integrations.storage.enabled
      ? `Storage (${options.integrations.storage.provider})`
      : null,
  ].filter(Boolean);

  const saasLayers = [
    options.saasCollaboration ? "collaboration" : null,
    options.saasBilling ? "billing" : null,
    options.saasMetering ? "metering" : null,
    options.saasSupport ? "support" : null,
    options.saasLaunch ? "launch" : null,
    options.saasReferrals ? "referrals" : null,
    options.saasOperatorApis ? "operator APIs" : null,
  ].filter(Boolean);

  const preferredDevCommands = [
    "- `pnpm bootstrap:local`",
    options.platforms.web ? "- `pnpm dev:next`" : null,
    options.platforms.mobile
      ? "- `pnpm --filter @gmacko/expo dev:client`"
      : null,
    options.platforms.tanstackStart
      ? "- `pnpm --filter @gmacko/tanstack-start dev`"
      : null,
    options.trpcOperators ? "- `pnpm trpc:ops -- --help`" : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `<!-- SCAFFOLD_PROFILE_START -->
> **Scaffold profile**
> - Platforms: ${platforms.join(", ") || "none selected"}
> - Integrations: ${integrations.join(", ") || "core only"}
> - SaaS layers: ${saasLayers.join(", ") || "none selected"}
> - Default deploy path: ForgeGraph + Nix + colocated Postgres
> - Workers lane: ${options.vinext ? "vinext enabled (experimental)" : "not scaffolded"}
> - Claude SaaS bootstrap pack: ${options.saasBootstrap ? "enabled" : "not scaffolded"}
> - Operator lane: ${options.trpcOperators ? "CLI + MCP wrappers over the same tRPC API" : "not scaffolded"}
>
> **Recommended first commands**
${preferredDevCommands}
<!-- SCAFFOLD_PROFILE_END -->`;
}

function getPrimaryServicePath(options: CliOptions): string {
  if (options.platforms.web) return "apps/nextjs";
  if (options.platforms.tanstackStart) return "apps/tanstack-start";
  if (options.platforms.mobile) return "apps/expo";
  return ".";
}

function getHealthcheckHint(options: CliOptions): string {
  if (options.platforms.web) return "/api/health";
  if (options.platforms.tanstackStart) return "/api/health";
  if (options.platforms.mobile) return "n/a (mobile-only scaffold)";
  return "n/a";
}

function createForgeGraphConfig(targetDir: string, options: CliOptions): void {
  const primaryServicePath = getPrimaryServicePath(options);
  const healthcheckHint = options.integrations.forgegraph
    ? "/.well-known/forge-health"
    : getHealthcheckHint(options);

  const resources: string[] = [];
  resources.push("  - type: postgres");
  if (options.integrations.realtime.enabled) {
    resources.push("  - type: redis");
  }

  fs.writeFileSync(
    path.join(targetDir, ".forgegraph.yaml"),
    `app: ${options.appName}
server: ${options.forgegraphServer}
stages:
  - name: staging
    nodeId: ${options.forgegraphStagingNode}
    sortOrder: 10
  - name: production
    nodeId: ${options.forgegraphProductionNode}
    sortOrder: 20

resources:
${resources.join("\n")}

# ForgeGraph operator notes:
# flakeRef: .
# primary web service path: ${primaryServicePath}
# healthcheck path: ${healthcheckHint}
# database strategy: colocated-postgres
# preview domain: ${options.forgegraphPreviewDomain}
# production domain: ${options.forgegraphProductionDomain}
`,
  );
}

function addForgeGraphScripts(targetDir: string): void {
  const rootPackagePath = path.join(targetDir, "package.json");
  const rootPackage = fs.readJsonSync(rootPackagePath) as {
    scripts?: Record<string, string>;
  };

  rootPackage.scripts ??= {};
  rootPackage.scripts["forge:diff"] = "forge diff";
  rootPackage.scripts["forge:apply"] = "forge apply";
  rootPackage.scripts["forge:pull"] = "forge pull";
  rootPackage.scripts["forge:deploy:staging"] =
    "forge deploy create staging --wait";
  rootPackage.scripts["forge:deploy:production"] =
    "forge deploy create production --wait";
  rootPackage.scripts["forge:stages"] = "forge stage list";

  fs.writeJsonSync(rootPackagePath, rootPackage, { spaces: 2 });
}

function addOptionalOperatorScripts(
  targetDir: string,
  options: CliOptions,
): void {
  if (!options.trpcOperators) {
    return;
  }

  const rootPackagePath = path.join(targetDir, "package.json");
  const rootPackage = fs.readJsonSync(rootPackagePath) as {
    scripts?: Record<string, string>;
  };

  rootPackage.scripts ??= {};
  rootPackage.scripts["trpc:ops"] =
    "pnpm --filter @gmacko/trpc-cli exec gmacko-ops";
  rootPackage.scripts["mcp:app"] =
    "pnpm --filter @gmacko/mcp-server exec gmacko-mcp";

  fs.writeJsonSync(rootPackagePath, rootPackage, { spaces: 2 });
}

function customizeMcpConfig(targetDir: string, options: CliOptions): void {
  if (!options.includeAi || !options.trpcOperators) {
    return;
  }

  const mcpConfigPath = path.join(targetDir, ".mcp.json");
  if (!fs.existsSync(mcpConfigPath)) {
    return;
  }

  const mcpConfig = fs.readJsonSync(mcpConfigPath) as {
    mcpServers?: Record<
      string,
      {
        command?: string;
        args?: string[];
        env?: Record<string, string>;
      }
    >;
  };

  mcpConfig.mcpServers ??= {};
  mcpConfig.mcpServers["gmacko-app"] = {
    command: "pnpm",
    args: ["--filter", "@gmacko/mcp-server", "exec", "gmacko-mcp"],
    env: {
      GMACKO_API_URL: "http://localhost:3000",
      GMACKO_API_KEY: "change-me",
    },
  };

  fs.writeJsonSync(mcpConfigPath, mcpConfig, { spaces: 2 });
}

function customizeClaudeInstructions(
  targetDir: string,
  options: CliOptions,
): void {
  if (!options.includeAi || !options.saasBootstrap) {
    return;
  }

  const claudePath = path.join(targetDir, "CLAUDE.md");
  if (!fs.existsSync(claudePath)) {
    return;
  }

  const content = fs.readFileSync(claudePath, "utf8");
  if (content.includes("## Post-Setup SaaS Bootstrap")) {
    return;
  }

  fs.writeFileSync(
    claudePath,
    `${content.trimEnd()}

## Post-Setup SaaS Bootstrap

After \`pnpm bootstrap:local\`:

1. Run \`/office-hours\` to pressure-test the problem, customer, and wedge.
2. If your user-level gstack install includes \`/autoplan\`, run it next to turn the product direction into an execution track.
3. Run \`/design-consultation\` once the problem and audience are clear so \`DESIGN.md\` becomes the visual source of truth.
4. Then use the local skills in \`.claude/skills/bootstrap-saas\`, \`.claude/skills/launch-landing-page\`, \`.claude/skills/setup-stripe-billing\`, \`.claude/skills/bootstrap-expo-app\`, and \`.claude/skills/test-mobile-with-maestro\`.
`,
  );
}

function configureVinext(targetDir: string): void {
  const nextPkgPath = path.join(targetDir, "apps/nextjs/package.json");
  const nextPkg = fs.readJsonSync(nextPkgPath) as {
    scripts?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  nextPkg.scripts ??= {};
  nextPkg.devDependencies ??= {};

  nextPkg.scripts["prebuild:vinext"] =
    "pnpm --dir ../.. --filter @gmacko/nextjs^... build";
  nextPkg.scripts["dev:vinext"] =
    "pnpm prebuild:vinext && pnpm with-env vinext dev";
  nextPkg.scripts["build:vinext"] =
    "pnpm prebuild:vinext && pnpm with-env vinext build";
  nextPkg.scripts["start:vinext"] = "pnpm with-env vinext start";
  nextPkg.scripts["deploy:cloudflare"] = "pnpm deploy:cloudflare:production";
  nextPkg.scripts["deploy:cloudflare:staging"] =
    "pnpm build:vinext && pnpm with-env wrangler deploy --env staging";
  nextPkg.scripts["deploy:cloudflare:production"] =
    "pnpm build:vinext && pnpm with-env wrangler deploy";

  nextPkg.devDependencies.vinext = "^0.0.35";
  nextPkg.devDependencies.vite = "^8.0.2";
  nextPkg.devDependencies.wrangler = "^4.77.0";
  nextPkg.devDependencies["@cloudflare/vite-plugin"] = "^1.30.1";
  nextPkg.devDependencies["@vitejs/plugin-rsc"] = "^0.5.21";
  nextPkg.devDependencies = sortObjectKeys(nextPkg.devDependencies);

  fs.writeJsonSync(nextPkgPath, nextPkg, { spaces: 2 });

  fs.writeFileSync(
    path.join(targetDir, "apps/nextjs/vite.config.ts"),
    `import { cloudflare } from "@cloudflare/vite-plugin";
import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
    }),
  ],
});
`,
  );

  fs.writeFileSync(
    path.join(targetDir, "apps/nextjs/wrangler.jsonc"),
    `{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "${path.basename(targetDir)}",
  "compatibility_date": "2026-03-23",
  "compatibility_flags": ["nodejs_compat"],
  "main": "./worker/index.ts",
  "assets": {
    "directory": "dist/client",
    "not_found_handling": "none",
    "binding": "ASSETS"
  },
  "images": {
    "binding": "IMAGES"
  },
  "vars": {
    "APP_ENV": "production"
  },
  "env": {
    "staging": {
      "vars": {
        "APP_ENV": "staging"
      }
    }
  }
}
`,
  );

  fs.writeFileSync(
    path.join(targetDir, "apps/nextjs/src/cloudflare-env.ts"),
    `import { z } from "zod/v4";

export const cloudflareEnvSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("production"),
  CLOUDFLARE_ACCOUNT_ID: z.string().min(1),
  CLOUDFLARE_API_TOKEN: z.string().min(1),
});

export type CloudflareEnv = z.infer<typeof cloudflareEnvSchema>;
`,
  );

  fs.ensureDirSync(path.join(targetDir, "apps/nextjs/worker"));
  fs.writeFileSync(
    path.join(targetDir, "apps/nextjs/worker/index.ts"),
    `import {
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
  handleImageOptimization,
} from "vinext/server/image-optimization";
import type { ImageConfig } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  APP_ENV?: "development" | "staging" | "production";
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: {
          format: string;
          quality: number;
        }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const imageConfig: ImageConfig = {};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(
        request,
        {
          fetchAsset: (assetPath) =>
            env.ASSETS.fetch(new Request(new URL(assetPath, request.url))),
          imageConfig,
          transformImage: async (body, { width, format, quality }) => {
            const result = await env.IMAGES.input(body)
              .transform(width > 0 ? { width } : {})
              .output({ format, quality });
            return result.response();
          },
        },
        allowedWidths,
      );
    }

    return handler.fetch(request, env, ctx);
  },
};
`,
  );

  const envExamplePath = path.join(targetDir, ".env.example");
  const envExample = fs.readFileSync(envExamplePath, "utf-8");
  if (!envExample.includes("CLOUDFLARE_ACCOUNT_ID")) {
    fs.writeFileSync(
      envExamplePath,
      `${envExample}

# =====================================================
# OPTIONAL: Cloudflare Workers (vinext)
# Used for the experimental Next.js-on-Workers lane
# =====================================================
# CLOUDFLARE_ACCOUNT_ID='your-account-id'
# CLOUDFLARE_API_TOKEN='your-api-token'
`,
    );
  }

  fs.writeFileSync(
    path.join(targetDir, "apps/nextjs/README.cloudflare.md"),
    `# Cloudflare Workers Lane

This app includes an experimental \`vinext\` lane for Cloudflare Workers.

## Commands

\`\`\`bash
pnpm --filter @gmacko/nextjs dev:vinext
pnpm --filter @gmacko/nextjs build:vinext
pnpm --filter @gmacko/nextjs deploy:cloudflare:staging
pnpm --filter @gmacko/nextjs deploy:cloudflare:production
\`\`\`

## Required Env

- \`CLOUDFLARE_ACCOUNT_ID\`
- \`CLOUDFLARE_API_TOKEN\`

## Notes

- This lane is experimental and should not replace the default ForgeGraph + Nix deployment path by accident.
- The generated Worker config lives in \`apps/nextjs/wrangler.jsonc\`.
- Prefer the root deployment guidance for the stable Hetzner VPS path.
`,
  );
}

function sortObjectKeys(
  record: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).sort(([left], [right]) => left.localeCompare(right)),
  );
}

function configureExpoApp(
  targetDir: string,
  appName: string,
  displayName: string,
): void {
  const expoConfigPath = path.join(targetDir, "apps/expo/app.config.ts");
  const sanitizedId = appName.replace(/[^a-z0-9-]/gi, "").toLowerCase();
  const bundleSegment = sanitizedId.replace(/-/g, "");

  let content = fs.readFileSync(expoConfigPath, "utf-8");
  content = content.replace(
    /const base = "com\.gmacko\.app";/,
    `const base = "com.gmacko.${bundleSegment}";`,
  );
  content = content.replace(/return "Gmacko";/, `return "${displayName}";`);
  content = content.replace(
    /return "Gmacko \(Beta\)";/,
    `return "${displayName} (Beta)";`,
  );
  content = content.replace(
    /return "Gmacko \(Dev\)";/,
    `return "${displayName} (Dev)";`,
  );
  content = content.replace(/slug: "gmacko",/, `slug: "${sanitizedId}",`);
  content = content.replace(/scheme: "gmacko",/, `scheme: "${sanitizedId}",`);

  fs.writeFileSync(expoConfigPath, content);
}

function pruneIntegrations(
  targetDir: string,
  integrations: IntegrationConfig,
): void {
  const packagesToPrune: string[] = [];

  if (!integrations.sentry) {
    packagesToPrune.push("monitoring");
  }
  if (!integrations.posthog) {
    packagesToPrune.push("analytics");
  }
  if (!integrations.stripe) {
    packagesToPrune.push("payments");
  }
  if (!integrations.revenuecat) {
    packagesToPrune.push("purchases");
  }
  if (!integrations.notifications) {
    packagesToPrune.push("notifications");
  }
  if (!integrations.email.enabled) {
    packagesToPrune.push("email");
  }
  if (!integrations.realtime.enabled) {
    packagesToPrune.push("realtime");
  }
  if (!integrations.storage.enabled) {
    packagesToPrune.push("storage");
  }

  for (const pkg of packagesToPrune) {
    const pkgDir = path.join(targetDir, `packages/${pkg}`);
    if (fs.existsSync(pkgDir)) {
      fs.removeSync(pkgDir);
    }
  }

  if (!integrations.sentry) {
    pruneNextSentryFiles(targetDir);
  }

  if (!integrations.posthog) {
    pruneNextAnalyticsFiles(targetDir);
  }

  for (const app of ["nextjs", "expo", "tanstack-start"]) {
    const appPkgPath = path.join(targetDir, `apps/${app}/package.json`);
    if (fs.existsSync(appPkgPath)) {
      const pkg = fs.readJsonSync(appPkgPath);
      for (const pkgName of packagesToPrune) {
        delete pkg.dependencies?.[`@gmacko/${pkgName}`];
        delete pkg.devDependencies?.[`@gmacko/${pkgName}`];
      }
      fs.writeJsonSync(appPkgPath, pkg, { spaces: 2 });
    }
  }
}

function pruneOptionalLanes(targetDir: string, options: CliOptions): void {
  if (!options.saasBootstrap) {
    fs.removeSync(path.join(targetDir, "docs/ai/BOOTSTRAP_PLAYBOOK.md"));
    fs.removeSync(path.join(targetDir, ".claude/skills/bootstrap-saas"));
    fs.removeSync(path.join(targetDir, ".claude/skills/launch-landing-page"));
    fs.removeSync(path.join(targetDir, ".claude/skills/setup-stripe-billing"));
    fs.removeSync(path.join(targetDir, ".claude/skills/bootstrap-expo-app"));
    fs.removeSync(
      path.join(targetDir, ".claude/skills/test-mobile-with-maestro"),
    );
  }

  if (!options.trpcOperators) {
    fs.removeSync(path.join(targetDir, "packages/operator-core"));
    fs.removeSync(path.join(targetDir, "packages/trpc-cli"));
    fs.removeSync(path.join(targetDir, "packages/mcp-server"));
  }
}

function pruneNextSentryFiles(targetDir: string): void {
  const sentryFiles = [
    "apps/nextjs/sentry.client.config.ts",
    "apps/nextjs/sentry.edge.config.ts",
    "apps/nextjs/sentry.server.config.ts",
  ];

  for (const relativePath of sentryFiles) {
    const filePath = path.join(targetDir, relativePath);
    if (fs.existsSync(filePath)) {
      fs.removeSync(filePath);
    }
  }

  removeSnippet(
    path.join(targetDir, "apps/nextjs/src/app/error.tsx"),
    'import { captureException } from "@gmacko/monitoring/web";\n',
  );
  removeSnippet(
    path.join(targetDir, "apps/nextjs/src/app/error.tsx"),
    `    // Report error to Sentry if enabled
    if (integrations.sentry) {
      captureException(error);
    }

`,
  );

  removeSnippet(
    path.join(targetDir, "apps/nextjs/src/app/global-error.tsx"),
    'import { captureException } from "@gmacko/monitoring/web";\n',
  );
  removeSnippet(
    path.join(targetDir, "apps/nextjs/src/app/global-error.tsx"),
    `    // Report error to Sentry if enabled
    if (integrations.sentry) {
      captureException(error);
    }

`,
  );

  removeSnippet(
    path.join(targetDir, "apps/nextjs/src/components/error-boundary.tsx"),
    'import { captureException } from "@gmacko/monitoring/web";\n',
  );
  removeSnippet(
    path.join(targetDir, "apps/nextjs/src/components/error-boundary.tsx"),
    `    // Report to Sentry if enabled
    if (integrations.sentry) {
      captureException(error);
    }

`,
  );

  const instrumentationPath = path.join(
    targetDir,
    "apps/nextjs/src/instrumentation.ts",
  );
  if (fs.existsSync(instrumentationPath)) {
    fs.writeFileSync(
      instrumentationPath,
      `export async function register() {}
`,
    );
  }
}

function pruneNextAnalyticsFiles(targetDir: string): void {
  const providersPath = path.join(
    targetDir,
    "apps/nextjs/src/app/providers.tsx",
  );
  if (!fs.existsSync(providersPath)) return;

  fs.writeFileSync(
    providersPath,
    `"use client";

import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}
`,
  );
}

function removeSnippet(filePath: string, snippet: string): void {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.includes(snippet)) return;

  fs.writeFileSync(filePath, content.replace(snippet, ""));
}

function getAllFiles(dir: string): string[] {
  const files: string[] = [];

  function walk(currentDir: string) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (
          entry.name !== "node_modules" &&
          entry.name !== ".git" &&
          entry.name !== "dist"
        ) {
          walk(fullPath);
        }
      } else {
        files.push(fullPath);
      }
    }
  }

  walk(dir);
  return files;
}

function isLocalTemplatePath(templateRepo: string): boolean {
  return fs.existsSync(templateRepo) && fs.statSync(templateRepo).isDirectory();
}

function shouldCopyTemplatePath(src: string, templateRoot: string): boolean {
  const basename = path.basename(src);

  if (
    basename === ".git" ||
    basename === "node_modules" ||
    basename === ".turbo" ||
    basename === ".cache" ||
    basename === "dist"
  ) {
    return false;
  }

  if (src === templateRoot) {
    return true;
  }

  return true;
}
