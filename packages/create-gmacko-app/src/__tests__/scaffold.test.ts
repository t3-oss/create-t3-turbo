import path from "node:path";
import fs from "fs-extra";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  cleanupApp,
  EXPECTED_FILES,
  ensureTempDir,
  fileExists,
  generateAppName,
  readFile,
  readJson,
  runCli,
} from "./helpers.js";

describe("create-gmacko-app scaffold", () => {
  let tempDir: string;
  const appsToClean: string[] = [];

  beforeAll(() => {
    tempDir = ensureTempDir();
  });

  afterAll(() => {
    // Clean up all test apps
    for (const appPath of appsToClean) {
      cleanupApp(appPath);
    }
  });

  describe("basic scaffolding", () => {
    it("should scaffold a new app with defaults", async () => {
      const appName = generateAppName("basic");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "package.json")).toBe(true);

      // Check root package.json
      const pkg = readJson<{ name: string }>(result.appPath, "package.json");
      expect(pkg.name).toBe(appName);

      // Check core files exist
      for (const file of EXPECTED_FILES.core) {
        expect(fileExists(result.appPath, file)).toBe(true);
      }
      expect(
        fileExists(result.appPath, "packages/operator-core/package.json"),
      ).toBe(false);
      expect(fileExists(result.appPath, "packages/trpc-cli/package.json")).toBe(
        false,
      );
      expect(
        fileExists(result.appPath, "packages/mcp-server/package.json"),
      ).toBe(false);
    }, 120000);

    it("should include web app by default", async () => {
      const appName = generateAppName("with-web");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      for (const file of EXPECTED_FILES.withWeb) {
        expect(fileExists(result.appPath, file)).toBe(true);
      }
    }, 120000);

    it("should include Storybook for the web app by default", async () => {
      const appName = generateAppName("with-storybook");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      for (const file of EXPECTED_FILES.withStorybook) {
        expect(fileExists(result.appPath, file)).toBe(true);
      }
    }, 120000);

    it("should include mobile app by default", async () => {
      const appName = generateAppName("with-mobile");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      for (const file of EXPECTED_FILES.withMobile) {
        expect(fileExists(result.appPath, file)).toBe(true);
      }
    }, 120000);

    it("should include AI workflow by default", async () => {
      const appName = generateAppName("with-ai");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      for (const file of EXPECTED_FILES.withAi) {
        expect(fileExists(result.appPath, file)).toBe(true);
      }
    }, 120000);

    it("should include Claude planning and design workflow guidance", async () => {
      const appName = generateAppName("with-claude-guidance");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const agentsInstructions = readFile(result.appPath, "AGENTS.md");
      const claudeInstructions = readFile(result.appPath, "CLAUDE.md");
      const initialProposal = readFile(
        result.appPath,
        "docs/ai/INITIAL_PROPOSAL.md",
      );

      expect(agentsInstructions).toContain("Codex");
      expect(agentsInstructions).toContain("Claude Code");
      expect(agentsInstructions).toContain("OpenCode");
      expect(claudeInstructions).toContain("superpowers:brainstorming");
      expect(claudeInstructions).toContain("/plan-ceo-review");
      expect(claudeInstructions).toContain("/plan-eng-review");
      expect(claudeInstructions).toContain("/design-consultation");
      expect(claudeInstructions).toContain("DESIGN.md");

      expect(initialProposal).toContain("superpowers:brainstorming");
      expect(initialProposal).toContain("/plan-ceo-review");
      expect(initialProposal).toContain("/plan-eng-review");
      expect(initialProposal).toContain("/design-consultation");
    }, 120000);

    it("should include create-gmacko-app repo skill guidance for Claude", async () => {
      const appName = generateAppName("with-gmacko-skill");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const claudeInstructions = readFile(result.appPath, "CLAUDE.md");
      const repoSkill = readFile(
        result.appPath,
        ".claude/skills/create-gmacko-app-workflow/SKILL.md",
      );

      expect(claudeInstructions).toContain("create-gmacko-app-workflow");
      expect(repoSkill).toContain("apps/nextjs");
      expect(repoSkill).toContain("packages/ui");
      expect(repoSkill).toContain("docs/ai");
      expect(repoSkill).toContain("Storybook");
    }, 120000);

    it("should scaffold postgres-first runtime files with nix support", async () => {
      const appName = generateAppName("postgres-nix");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "flake.nix")).toBe(true);

      const dbPackage = readJson<{
        dependencies?: Record<string, string>;
      }>(result.appPath, "packages/db/package.json");
      const dbClient = readFile(result.appPath, "packages/db/src/client.ts");

      expect(dbPackage.dependencies?.postgres).toBeDefined();
      expect(dbPackage.dependencies?.["@neondatabase/serverless"]).toBeFalsy();
      expect(dbClient).toContain('from "postgres"');
      expect(dbClient).toContain('from "drizzle-orm/postgres-js"');
      expect(dbClient).not.toContain("@neondatabase/serverless");
      expect(dbClient).not.toContain("drizzle-orm/neon-http");
    }, 120000);

    it("should scaffold ForgeGraph repo metadata by default", async () => {
      const appName = generateAppName("forgegraph-bootstrap");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const forgeGraphConfig = readFile(result.appPath, ".forgegraph.yaml");

      expect(forgeGraphConfig).toContain(`app: ${appName}`);
      expect(forgeGraphConfig).toContain("server: https://forge.example.com");
      expect(forgeGraphConfig).toContain("stages:");
      expect(forgeGraphConfig).toContain("- name: staging");
      expect(forgeGraphConfig).toContain("- name: production");
      expect(forgeGraphConfig).toContain("nodeId: change-me-staging-node");
      expect(forgeGraphConfig).toContain("nodeId: change-me-production-node");
      expect(forgeGraphConfig).toContain("sortOrder: 10");
      expect(forgeGraphConfig).toContain("sortOrder: 20");
      expect(forgeGraphConfig).toContain("# ForgeGraph operator notes:");
      expect(forgeGraphConfig).toContain("# flakeRef: .");
      expect(forgeGraphConfig).toContain(
        "# primary web service path: apps/nextjs",
      );
      expect(forgeGraphConfig).toContain(
        "# healthcheck path: /.well-known/forge-health",
      );
      expect(forgeGraphConfig).toContain("resources:");
      expect(forgeGraphConfig).toContain("- type: postgres");
      expect(forgeGraphConfig).toContain(
        "# database strategy: colocated-postgres",
      );
      expect(forgeGraphConfig).toContain(
        "# preview domain: change-me.preview.example.com",
      );
      expect(forgeGraphConfig).toContain(
        "# production domain: change-me.example.com",
      );
    }, 120000);

    it("should allow ForgeGraph config to be customized from CLI flags", async () => {
      const appName = generateAppName("forgegraph-custom");
      const result = await runCli({
        appName,
        flags: [
          "--yes",
          "--no-install",
          "--no-git",
          "--forgegraph-server",
          "https://forge.gmac.io",
          "--forgegraph-staging-node",
          "node-staging-1",
          "--forgegraph-production-node",
          "node-production-1",
          "--forgegraph-preview-domain",
          "pr.preview.gmac.io",
          "--forgegraph-production-domain",
          "app.gmac.io",
        ],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const forgeGraphConfig = readFile(result.appPath, ".forgegraph.yaml");

      expect(forgeGraphConfig).toContain("server: https://forge.gmac.io");
      expect(forgeGraphConfig).toContain("nodeId: node-staging-1");
      expect(forgeGraphConfig).toContain("nodeId: node-production-1");
      expect(forgeGraphConfig).toContain(
        "# preview domain: pr.preview.gmac.io",
      );
      expect(forgeGraphConfig).toContain("# production domain: app.gmac.io");
    }, 120000);

    it("should scaffold with forgegraph integration config", async () => {
      const appName = generateAppName("forgegraph-integration");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--forgegraph"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);
      expect(result.exitCode).toBe(0);

      const integrationsConfig = readFile(
        result.appPath,
        "packages/config/src/integrations.ts",
      );
      expect(integrationsConfig).toContain("forgegraph: true");

      const forgeGraphConfig = readFile(result.appPath, ".forgegraph.yaml");
      expect(forgeGraphConfig).toContain(
        "# healthcheck path: /.well-known/forge-health",
      );
      expect(forgeGraphConfig).toContain("resources:");
      expect(forgeGraphConfig).toContain("- type: postgres");
    }, 120000);

    it("should scaffold vinext support when requested", async () => {
      const appName = generateAppName("vinext");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--vinext"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "apps/nextjs/vite.config.ts")).toBe(
        true,
      );
      expect(fileExists(result.appPath, "apps/nextjs/wrangler.jsonc")).toBe(
        true,
      );
      expect(
        fileExists(result.appPath, "apps/nextjs/README.cloudflare.md"),
      ).toBe(true);
      expect(fileExists(result.appPath, "apps/nextjs/worker/index.ts")).toBe(
        true,
      );

      const nextPkg = readJson<{
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>(result.appPath, "apps/nextjs/package.json");
      const viteConfig = readFile(result.appPath, "apps/nextjs/vite.config.ts");
      const wranglerConfig = readFile(
        result.appPath,
        "apps/nextjs/wrangler.jsonc",
      );
      const cloudflareEnv = readFile(
        result.appPath,
        "apps/nextjs/src/cloudflare-env.ts",
      );
      const envExample = readFile(result.appPath, ".env.example");
      const cloudflareReadme = readFile(
        result.appPath,
        "deploy/cloudflare/README.md",
      );
      const appLocalCloudflareReadme = readFile(
        result.appPath,
        "apps/nextjs/README.cloudflare.md",
      );

      expect(nextPkg.scripts?.["dev:vinext"]).toBeDefined();
      expect(nextPkg.scripts?.["build:vinext"]).toBeDefined();
      expect(nextPkg.scripts?.["deploy:cloudflare"]).toBeDefined();
      expect(nextPkg.scripts?.["deploy:cloudflare:staging"]).toBeDefined();
      expect(nextPkg.scripts?.["deploy:cloudflare:production"]).toBeDefined();
      expect(nextPkg.scripts?.["prebuild:vinext"]).toBe(
        "pnpm --dir ../.. --filter @gmacko/nextjs^... build",
      );
      expect(nextPkg.scripts?.["build:vinext"]).toContain(
        "pnpm prebuild:vinext",
      );
      expect(nextPkg.scripts?.["build:vinext"]).toContain(
        "pnpm with-env vinext build",
      );
      expect(nextPkg.scripts?.["deploy:cloudflare:staging"]).toContain(
        "pnpm with-env wrangler deploy --env staging",
      );
      expect(nextPkg.scripts?.["deploy:cloudflare:production"]).toContain(
        "pnpm with-env wrangler deploy",
      );
      const nextDevDependencyNames = Object.keys(nextPkg.devDependencies ?? {});
      expect(nextDevDependencyNames).toEqual(
        [...nextDevDependencyNames].sort((left, right) =>
          left.localeCompare(right),
        ),
      );
      expect(nextPkg.devDependencies?.vinext).toBeDefined();
      expect(nextPkg.devDependencies?.vite).toBeDefined();
      expect(nextPkg.devDependencies?.wrangler).toBeDefined();
      expect(nextPkg.devDependencies?.["@vitejs/plugin-rsc"]).toBeDefined();
      expect(viteConfig).toContain("@cloudflare/vite-plugin");
      expect(viteConfig).toContain("cloudflare({");
      expect(wranglerConfig).toContain(`"name": "${appName}"`);
      expect(wranglerConfig).toContain('"compatibility_date"');
      expect(wranglerConfig).toContain('"compatibility_flags"');
      expect(wranglerConfig).toContain('"nodejs_compat"');
      expect(wranglerConfig).toContain('"main": "./worker/index.ts"');
      expect(wranglerConfig).toContain('"assets"');
      expect(wranglerConfig).toContain('"binding": "ASSETS"');
      expect(wranglerConfig).toContain('"images"');
      expect(wranglerConfig).toContain('"binding": "IMAGES"');
      expect(wranglerConfig).toContain('"vars"');
      expect(wranglerConfig).toContain('"APP_ENV": "production"');
      expect(wranglerConfig).toContain('"env"');
      expect(wranglerConfig).toContain('"staging"');
      expect(cloudflareEnv).toContain("CLOUDFLARE_ACCOUNT_ID");
      expect(cloudflareEnv).toContain("CLOUDFLARE_API_TOKEN");
      expect(envExample).toContain("CLOUDFLARE_ACCOUNT_ID");
      expect(envExample).toContain("CLOUDFLARE_API_TOKEN");
      expect(cloudflareReadme).toContain(
        "pnpm --filter @gmacko/nextjs build:vinext",
      );
      expect(cloudflareReadme).toContain(
        "pnpm --filter @gmacko/nextjs deploy:cloudflare:staging",
      );
      expect(cloudflareReadme).toContain(
        "pnpm --filter @gmacko/nextjs deploy:cloudflare:production",
      );
      expect(appLocalCloudflareReadme).toContain("vinext");
      expect(appLocalCloudflareReadme).toContain("experimental");
      expect(appLocalCloudflareReadme).toContain(
        "pnpm --filter @gmacko/nextjs dev:vinext",
      );
      expect(appLocalCloudflareReadme).toContain(
        "pnpm --filter @gmacko/nextjs build:vinext",
      );
      expect(appLocalCloudflareReadme).toContain(
        "pnpm --filter @gmacko/nextjs deploy:cloudflare:staging",
      );
      expect(appLocalCloudflareReadme).toContain("CLOUDFLARE_ACCOUNT_ID");
      expect(appLocalCloudflareReadme).toContain("CLOUDFLARE_API_TOKEN");
    }, 120000);

    it("should scaffold stronger Expo development-build defaults", async () => {
      const appName = generateAppName("expo-dx");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "apps/expo/README.md")).toBe(true);

      const expoPkg = readJson<{
        scripts?: Record<string, string>;
        dependencies?: Record<string, string>;
      }>(result.appPath, "apps/expo/package.json");
      const expoReadme = readFile(result.appPath, "apps/expo/README.md");
      const expoConfig = readFile(result.appPath, "apps/expo/app.config.ts");
      const expoIndex = readFile(result.appPath, "apps/expo/src/app/index.tsx");
      const expoSettings = readFile(
        result.appPath,
        "apps/expo/src/app/settings.tsx",
      );
      const settingsRouter = readFile(
        result.appPath,
        "packages/api/src/router/settings.ts",
      );
      const authEnv = readFile(result.appPath, "packages/auth/env.ts");
      const authIndex = readFile(result.appPath, "packages/auth/src/index.ts");
      const mobileQa = readFile(result.appPath, "apps/expo/docs/mobile-qa.md");
      const rootReadme = readFile(result.appPath, "README.md");
      const expectedDisplayName = appName
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

      expect(expoPkg.scripts?.["dev:client"]).toBeDefined();
      expect(expoPkg.scripts?.["build:device:ios"]).toBeDefined();
      expect(expoPkg.scripts?.["build:device:android"]).toBeDefined();
      expect(expoPkg.scripts?.["check:app-store"]).toBe(
        "node ./scripts/check-app-store-readiness.mjs",
      );
      expect(expoPkg.dependencies?.["expo-apple-authentication"]).toBeDefined();
      expect(expoReadme).toContain("Expo Orbit");
      expect(expoReadme).toContain("development build");
      expect(expoReadme).toContain("EXPO_PUBLIC_APP_DOMAIN");
      expect(expoReadme).toContain("associated domains");
      expect(expoReadme).toContain("bundle identifier");
      expect(expoReadme).toContain("Sign in with Apple");
      expect(expoReadme).toContain("account deletion");
      expect(expoConfig).toContain(`slug: "${appName}"`);
      expect(expoConfig).toContain(`scheme: "${appName}"`);
      expect(expoConfig).toContain(
        `const base = "com.gmacko.${appName.replace(/-/g, "")}"`,
      );
      expect(expoConfig).toContain(`return "${expectedDisplayName}";`);
      expect(expoConfig).toContain(`return "${expectedDisplayName} (Beta)";`);
      expect(expoConfig).toContain(`return "${expectedDisplayName} (Dev)";`);
      expect(expoConfig).toContain("EXPO_PUBLIC_APP_DOMAIN");
      expect(expoConfig).toContain('"change-me.example.com"');
      expect(expoConfig).toContain("usesAppleSignIn: true");
      expect(expoConfig).toContain('"expo-apple-authentication"');
      expect(expoConfig).toContain(
        "associatedDomains: [`applinks:${ASSOCIATED_DOMAIN}`]",
      );
      expect(expoConfig).toContain('scheme: "https"');
      expect(expoConfig).toContain("host: ASSOCIATED_DOMAIN");
      expect(expoConfig).toContain(
        "Scaffold note: replace these app identifiers and domains before store submission.",
      );
      expect(expoIndex).toContain("AppleAuthenticationButton");
      expect(expoIndex).toContain('provider: "apple"');
      expect(expoSettings).toContain("Delete Account");
      expect(expoSettings).toContain("deleteAccount");
      expect(settingsRouter).toContain("deleteAccount:");
      expect(settingsRouter).toContain(".delete(user)");
      expect(authEnv).toContain("AUTH_APPLE_ID");
      expect(authEnv).toContain("AUTH_APPLE_SECRET");
      expect(authEnv).toContain("AUTH_APPLE_BUNDLE_ID");
      expect(authIndex).toContain("apple:");
      expect(authIndex).toContain("appBundleIdentifier");
      expect(authIndex).toContain("https://appleid.apple.com");
      expect(mobileQa).toContain("Sign in with Apple");
      expect(mobileQa).toContain("account deletion");
      expect(rootReadme).toContain("Scaffold profile");
      expect(rootReadme).toContain("Platforms: Next.js, Expo");
      expect(rootReadme).toContain(
        "Default deploy path: ForgeGraph + Nix + colocated Postgres",
      );
      expect(rootReadme).toContain("pnpm bootstrap:local");
      expect(rootReadme).not.toContain(
        "Generated repos replace this block with a scaffold-specific profile summary.",
      );
      expect(rootReadme).toContain("Expo Orbit");
      expect(rootReadme).toContain("dev:client");
    }, 120000);

    it("should scaffold an app-store readiness script for Expo", async () => {
      const appName = generateAppName("expo-app-store");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(
        fileExists(
          result.appPath,
          "apps/expo/scripts/check-app-store-readiness.mjs",
        ),
      ).toBe(true);

      const appStoreCheck = readFile(
        result.appPath,
        "apps/expo/scripts/check-app-store-readiness.mjs",
      );

      expect(appStoreCheck).toContain("change-me.example.com");
      expect(appStoreCheck).toContain("your-project-id");
      expect(appStoreCheck).toContain("Your App Name");
      expect(appStoreCheck).toContain("privacy_url.txt");
      expect(appStoreCheck).toContain("support_url.txt");
      expect(appStoreCheck).toContain("process.exit(1)");
    }, 120000);

    it("should scaffold web env files without vercel presets", async () => {
      const appName = generateAppName("no-vercel-env");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--tanstack-start"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const nextEnv = readFile(result.appPath, "apps/nextjs/src/env.ts");
      const tanstackEnv = readFile(
        result.appPath,
        "apps/tanstack-start/src/env.ts",
      );

      expect(nextEnv).not.toContain("presets-zod");
      expect(nextEnv).not.toContain("vercel()");
      expect(tanstackEnv).not.toContain("presets-zod");
      expect(tanstackEnv).not.toContain("vercel()");
    }, 120000);

    it("should scaffold without vercel-specific runtime env hooks", async () => {
      const appName = generateAppName("no-vercel-runtime");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--tanstack-start"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const turboConfig = readFile(result.appPath, "turbo.json");
      const analyticsWeb = readFile(
        result.appPath,
        "packages/analytics/src/web/index.tsx",
      );
      const monitoringWeb = readFile(
        result.appPath,
        "packages/monitoring/src/web/index.ts",
      );
      const previewConfig = readFile(
        result.appPath,
        "packages/config/src/preview.ts",
      );

      expect(turboConfig).not.toContain("VERCEL_ENV");
      expect(turboConfig).not.toContain("VERCEL_URL");
      expect(analyticsWeb).not.toContain("VERCEL_ENV");
      expect(monitoringWeb).not.toContain("VERCEL_ENV");
      expect(previewConfig).not.toContain("VERCEL_GIT_COMMIT_REF");
      expect(previewConfig).not.toContain("VERCEL_GIT_COMMIT_SHA");
    }, 120000);

    it("should not ship legacy k8s or sst deployment assets", async () => {
      const appName = generateAppName("no-legacy-deploy-assets");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "deploy/README.md")).toBe(true);
      expect(fileExists(result.appPath, "deploy/k8s")).toBe(false);
      expect(fileExists(result.appPath, "deploy/sst")).toBe(false);
    }, 120000);

    it("should scaffold a ForgeGraph-oriented preview workflow", async () => {
      const appName = generateAppName("forgegraph-preview");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const previewWorkflow = readFile(
        result.appPath,
        ".github/workflows/preview.yml",
      );

      expect(previewWorkflow).toContain("ForgeGraph");
      expect(previewWorkflow).not.toContain("DEPLOY_TARGET");
      expect(previewWorkflow).not.toContain("Deploy to Vercel");
      expect(previewWorkflow).not.toContain("Deploy to Kubernetes");
      expect(previewWorkflow).not.toContain("vercel");
      expect(previewWorkflow).not.toContain("kubectl");
    }, 120000);

    it("should scaffold agent workflows around AGENTS.md and agent-native configs", async () => {
      const appName = generateAppName("agent-dx");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const agentsInstructions = readFile(result.appPath, "AGENTS.md");
      const claudeInstructions = readFile(result.appPath, "CLAUDE.md");
      const developerExperience = readFile(
        result.appPath,
        "docs/ai/DEVELOPER_EXPERIENCE.md",
      );
      const claudeSettings = readJson<{
        permissions?: {
          additionalDirectories?: string[];
          deny?: string[];
        };
      }>(result.appPath, ".claude/settings.json");
      const openCodeConfig = readJson<{
        instructions?: string[];
      }>(result.appPath, "opencode.json");
      const mcpConfig = readJson<{
        mcpServers?: Record<string, { command?: string; args?: string[] }>;
      }>(result.appPath, ".mcp.json");

      expect(agentsInstructions).toContain("AGENTS.md");
      expect(agentsInstructions).toContain("Codex");
      expect(agentsInstructions).toContain("Claude Code");
      expect(agentsInstructions).toContain("OpenCode");
      expect(claudeInstructions).toContain("AGENTS.md");
      expect(developerExperience).toContain("ForgeGraph");
      expect(developerExperience).toContain("vinext");
      expect(developerExperience).toContain("Expo Orbit");
      expect(claudeSettings.permissions?.additionalDirectories).toContain(
        "../ForgeGraph",
      );
      expect(openCodeConfig.instructions).toContain("AGENTS.md");
      expect(openCodeConfig.instructions).toContain(
        "docs/ai/DEVELOPER_EXPERIENCE.md",
      );
      expect(mcpConfig.mcpServers?.["next-devtools"]?.command).toBe("npx");
      expect(mcpConfig.mcpServers?.["next-devtools"]?.args).toContain(
        "next-devtools-mcp@latest",
      );

      const rootReadme = readFile(result.appPath, "README.md");
      expect(rootReadme).toContain("Agent quickstart");
      expect(rootReadme).toContain("AGENTS.md");
      expect(rootReadme).toContain(".mcp.json");
      expect(rootReadme).toContain(".claude/settings.json");
      expect(rootReadme).toContain("opencode.json");
    }, 120000);

    it("should scaffold a Claude SaaS bootstrap pack when requested", async () => {
      const appName = generateAppName("saas-bootstrap");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--saas-bootstrap"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(
        fileExists(result.appPath, ".claude/skills/bootstrap-saas/SKILL.md"),
      ).toBe(true);
      expect(
        fileExists(
          result.appPath,
          ".claude/skills/launch-landing-page/SKILL.md",
        ),
      ).toBe(true);
      expect(
        fileExists(
          result.appPath,
          ".claude/skills/setup-stripe-billing/SKILL.md",
        ),
      ).toBe(true);
      expect(
        fileExists(
          result.appPath,
          ".claude/skills/bootstrap-expo-app/SKILL.md",
        ),
      ).toBe(true);
      expect(
        fileExists(
          result.appPath,
          ".claude/skills/test-mobile-with-maestro/SKILL.md",
        ),
      ).toBe(true);
      expect(fileExists(result.appPath, "docs/ai/BOOTSTRAP_PLAYBOOK.md")).toBe(
        true,
      );

      const claudeInstructions = readFile(result.appPath, "CLAUDE.md");
      const bootstrapPlaybook = readFile(
        result.appPath,
        "docs/ai/BOOTSTRAP_PLAYBOOK.md",
      );
      const rootReadme = readFile(result.appPath, "README.md");
      const bootstrapSkill = readFile(
        result.appPath,
        ".claude/skills/bootstrap-saas/SKILL.md",
      );

      expect(claudeInstructions).toContain("After `pnpm bootstrap:local`");
      expect(claudeInstructions).toContain("/office-hours");
      expect(claudeInstructions).toContain("/autoplan");
      expect(claudeInstructions).toContain("/design-consultation");
      expect(claudeInstructions).toContain("bootstrap-saas");
      expect(bootstrapPlaybook).toContain("Post-setup SaaS bootstrap");
      expect(bootstrapPlaybook).toContain("/office-hours");
      expect(bootstrapPlaybook).toContain("/autoplan");
      expect(bootstrapPlaybook).toContain("/design-consultation");
      expect(bootstrapPlaybook).toContain("/bootstrap-expo-app");
      expect(bootstrapPlaybook).toContain("/test-mobile-with-maestro");
      expect(bootstrapPlaybook).toContain("## Claude-only");
      expect(bootstrapPlaybook).toContain("## Codex");
      expect(bootstrapPlaybook).toContain("## OpenCode");
      expect(bootstrapPlaybook).toContain("Claude-only");
      expect(bootstrapPlaybook).not.toContain("## Selected SaaS layers");
      expect(bootstrapPlaybook).not.toContain("/launch-landing-page");
      expect(bootstrapPlaybook).not.toContain("/setup-stripe-billing");
      expect(rootReadme).toContain("Post-setup SaaS bootstrap");
      expect(rootReadme).toContain("docs/ai/BOOTSTRAP_PLAYBOOK.md");
      expect(rootReadme).not.toContain(
        "/Volumes/dev/create-gmacko-app/docs/ai/BOOTSTRAP_PLAYBOOK.md",
      );
      expect(bootstrapSkill).toContain("/office-hours");
      expect(bootstrapSkill).toContain("/autoplan");
      expect(bootstrapSkill).toContain("/design-consultation");
    }, 120000);

    it("should scaffold feature-aware SaaS bootstrap recommendations when SaaS layers are selected", async () => {
      const appName = generateAppName("saas-bootstrap-aware");
      const result = await runCli({
        appName,
        flags: [
          "--yes",
          "--no-install",
          "--no-git",
          "--saas-bootstrap",
          "--saas-billing",
          "--saas-support",
          "--saas-operator-apis",
        ],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const bootstrapPlaybook = readFile(
        result.appPath,
        "docs/ai/BOOTSTRAP_PLAYBOOK.md",
      );
      const rootReadme = readFile(result.appPath, "README.md");

      expect(bootstrapPlaybook).toContain("## Claude-only");
      expect(bootstrapPlaybook).toContain("## Codex");
      expect(bootstrapPlaybook).toContain("## OpenCode");
      expect(bootstrapPlaybook).toContain("## Selected SaaS layers");
      expect(bootstrapPlaybook).toContain("Billing");
      expect(bootstrapPlaybook).toContain("Support");
      expect(bootstrapPlaybook).toContain("Operator APIs");
      expect(bootstrapPlaybook).toContain("/setup-stripe-billing");
      expect(bootstrapPlaybook).toContain("/launch-landing-page");
      expect(bootstrapPlaybook).toContain("pnpm trpc:ops -- --help");
      expect(bootstrapPlaybook).toContain("pnpm mcp:app");
      expect(bootstrapPlaybook).toContain("Claude-only");
      const selectedLayersStart = bootstrapPlaybook.indexOf(
        "## Selected SaaS layers",
      );
      const selectedLayersEnd = bootstrapPlaybook.indexOf(
        "- Use [docs/ai/BOOTSTRAP_PLAYBOOK.md](docs/ai/BOOTSTRAP_PLAYBOOK.md) for the full handoff.",
      );
      const selectedLayersSection =
        selectedLayersStart !== -1 && selectedLayersEnd !== -1
          ? bootstrapPlaybook.slice(selectedLayersStart, selectedLayersEnd)
          : "";
      expect(selectedLayersSection).not.toContain("/setup-stripe-billing");
      expect(selectedLayersSection).not.toContain("/launch-landing-page");
      expect(selectedLayersSection).not.toContain("Claude-only:");
      expect(rootReadme).toContain("Selected SaaS layers");
      expect(rootReadme).toContain("billing");
      expect(rootReadme).toContain("support");
      expect(rootReadme).toContain("operator APIs");
    }, 120000);

    it("should scaffold modular SaaS wizard options when requested", async () => {
      const appName = generateAppName("saas-wizard");
      const result = await runCli({
        appName,
        flags: [
          "--yes",
          "--no-install",
          "--no-git",
          "--saas-collaboration",
          "--saas-billing",
          "--saas-metering",
          "--saas-support",
          "--saas-launch",
          "--saas-referrals",
          "--saas-operator-apis",
        ],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(
        fileExists(result.appPath, "packages/operator-core/package.json"),
      ).toBe(true);
      expect(fileExists(result.appPath, "packages/trpc-cli/package.json")).toBe(
        true,
      );
      expect(
        fileExists(result.appPath, "packages/mcp-server/package.json"),
      ).toBe(true);
      expect(
        fileExists(result.appPath, "packages/mcp-server/src/core.ts"),
      ).toBe(true);

      const rootReadme = readFile(result.appPath, "README.md");
      const integrationsConfig = readFile(
        result.appPath,
        "packages/config/src/integrations.ts",
      );
      expect(rootReadme).toContain("Scaffold profile");
      expect(rootReadme).toContain("SaaS layers");
      expect(rootReadme).toContain("collaboration");
      expect(rootReadme).toContain("billing");
      expect(rootReadme).toContain("metering");
      expect(rootReadme).toContain("support");
      expect(rootReadme).toContain("launch");
      expect(rootReadme).toContain("referrals");
      expect(rootReadme).toContain("operator APIs");
      expect(integrationsConfig).toContain("export const saasFeatures = {");
      expect(integrationsConfig).toContain("collaboration: true");
      expect(integrationsConfig).toContain("billing: true");
      expect(integrationsConfig).toContain("metering: true");
      expect(integrationsConfig).toContain("support: true");
      expect(integrationsConfig).toContain("launch: true");
      expect(integrationsConfig).toContain("referrals: true");
      expect(integrationsConfig).toContain("operatorApis: true");
    }, 120000);

    it("should scaffold launch-control pages and public-shell copy", async () => {
      const appName = generateAppName("launch-shell");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--saas-launch"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(
        fileExists(result.appPath, "apps/nextjs/src/app/pricing/page.tsx"),
      ).toBe(true);
      expect(
        fileExists(result.appPath, "apps/nextjs/src/app/faq/page.tsx"),
      ).toBe(true);
      expect(
        fileExists(result.appPath, "apps/nextjs/src/app/changelog/page.tsx"),
      ).toBe(true);
      expect(
        fileExists(result.appPath, "apps/nextjs/src/app/contact/page.tsx"),
      ).toBe(true);
      expect(
        fileExists(result.appPath, "apps/nextjs/src/app/privacy/page.tsx"),
      ).toBe(true);
      expect(
        fileExists(result.appPath, "apps/nextjs/src/app/terms/page.tsx"),
      ).toBe(true);

      const publicHome = readFile(
        result.appPath,
        "apps/nextjs/src/app/page.tsx",
      );
      const adminRouter = readFile(
        result.appPath,
        "packages/api/src/router/admin.ts",
      );

      expect(publicHome).toContain("Maintenance mode");
      expect(publicHome).toContain("Request access");
      expect(publicHome).toContain("waitlist");
      expect(publicHome).toContain("See pricing");
      expect(publicHome).toContain("/contact");
      expect(adminRouter).toContain("maintenanceMode");
      expect(adminRouter).toContain("signupEnabled");
      expect(adminRouter).toContain("allowedEmailDomains");
      expect(adminRouter).toContain("waitlist");
    }, 120000);

    it("should scaffold a tRPC-backed operator CLI and MCP lane when requested", async () => {
      const appName = generateAppName("trpc-operators");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--trpc-operators"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(
        fileExists(result.appPath, "packages/operator-core/package.json"),
      ).toBe(true);
      expect(fileExists(result.appPath, "packages/trpc-cli/package.json")).toBe(
        true,
      );
      expect(fileExists(result.appPath, "packages/trpc-cli/src/index.ts")).toBe(
        true,
      );
      expect(
        fileExists(result.appPath, "packages/mcp-server/package.json"),
      ).toBe(true);

      const rootPackage = readJson<{
        scripts?: Record<string, string>;
      }>(result.appPath, "package.json");
      const mcpConfig = readJson<{
        mcpServers?: Record<
          string,
          { command?: string; args?: string[]; env?: Record<string, string> }
        >;
      }>(result.appPath, ".mcp.json");
      const operatorCorePackage = readJson<{
        name?: string;
      }>(result.appPath, "packages/operator-core/package.json");
      const integrationsConfig = readFile(
        result.appPath,
        "packages/config/src/integrations.ts",
      );
      const trpcCliPackage = readJson<{
        name?: string;
        bin?: Record<string, string>;
      }>(result.appPath, "packages/trpc-cli/package.json");
      const trpcCliSource = readFile(
        result.appPath,
        "packages/trpc-cli/src/index.ts",
      );
      const mcpServerSource = readFile(
        result.appPath,
        "packages/mcp-server/src/index.ts",
      );
      const mcpServerCoreSource = readFile(
        result.appPath,
        "packages/mcp-server/src/core.ts",
      );
      const rootReadme = readFile(result.appPath, "README.md");

      expect(rootPackage.scripts?.["trpc:ops"]).toContain("@gmacko/trpc-cli");
      expect(rootPackage.scripts?.["mcp:app"]).toContain("@gmacko/mcp-server");
      expect(operatorCorePackage.name).toBe("@gmacko/operator-core");
      expect(trpcCliPackage.name).toBe("@gmacko/trpc-cli");
      expect(Object.keys(trpcCliPackage.bin ?? {})).toContain("gmacko-ops");
      expect(trpcCliSource).toContain("@gmacko/operator-core");
      expect(mcpServerCoreSource).toContain("@gmacko/operator-core");
      expect(mcpServerSource).toContain('name: "gmacko-app"');
      expect(mcpServerSource).not.toContain(
        "Error: GMACKO_API_KEY environment variable is required",
      );
      expect(mcpConfig.mcpServers?.["gmacko-app"]?.command).toBe("pnpm");
      expect(mcpConfig.mcpServers?.["gmacko-app"]?.args).toContain(
        "@gmacko/mcp-server",
      );
      expect(mcpConfig.mcpServers?.["gmacko-app"]?.env).toMatchObject({
        GMACKO_API_URL: "http://localhost:3000",
        GMACKO_API_KEY: "change-me",
      });
      expect(rootReadme).toContain("CLI + MCP wrappers over the same tRPC API");
      expect(rootReadme).toContain("pnpm trpc:ops -- --help");
      expect(rootReadme).toContain("pnpm trpc:ops -- auth_help");
      expect(rootReadme).toContain("pnpm trpc:ops -- get_workspace_context");
      expect(rootReadme).toContain("pnpm trpc:ops -- list_api_keys");
      expect(rootReadme).toContain("pnpm mcp:app");
      expect(integrationsConfig).toContain("operatorApis: false");

      const doctorScript = readFile(result.appPath, "scripts/doctor.sh");
      expect(doctorScript).toContain("Operator API lane detected");
      expect(doctorScript).toContain("Operator API env values");
      expect(doctorScript).toContain("GMACKO_API_URL");
      expect(doctorScript).toContain("GMACKO_API_KEY");
    }, 120000);

    it("should omit the generated agent quickstart when AI workflow files are excluded", async () => {
      const appName = generateAppName("no-ai-quickstart");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--no-ai"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const rootReadme = readFile(result.appPath, "README.md");
      expect(rootReadme).not.toContain("## Agent quickstart");
    }, 120000);

    it("should scaffold a mobile QA checklist when Expo is included", async () => {
      const appName = generateAppName("mobile-qa");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "apps/expo/docs/mobile-qa.md")).toBe(
        true,
      );

      const expoReadme = readFile(result.appPath, "apps/expo/README.md");
      const mobileQa = readFile(result.appPath, "apps/expo/docs/mobile-qa.md");

      expect(expoReadme).toContain("mobile QA checklist");
      expect(mobileQa).toContain("dev client");
      expect(mobileQa).toContain("deep link");
      expect(mobileQa).toContain("auth callback");
      expect(mobileQa).toContain("store metadata");
      expect(mobileQa).toContain("release build");
    }, 120000);

    it("should not generate the mobile QA checklist when Expo is excluded", async () => {
      const appName = generateAppName("no-mobile-qa");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--no-mobile"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "apps/expo/docs/mobile-qa.md")).toBe(
        false,
      );
    }, 120000);

    it("should avoid legacy eslint suppression comments in scaffold source files", async () => {
      const appName = generateAppName("no-eslint-suppressions");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--tanstack-start"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const sourceFiles = [
        "apps/nextjs/src/trpc/react.tsx",
        "apps/nextjs/src/trpc/server.tsx",
        "apps/tanstack-start/src/lib/url.ts",
        "apps/tanstack-start/src/routeTree.gen.ts",
        "packages/trpc-client/src/client.ts",
        "packages/ui/src/theme.tsx",
      ].map((file) => readFile(result.appPath, file));

      for (const source of sourceFiles) {
        expect(source).not.toContain("eslint-disable");
      }
    }, 120000);

    it("should keep active guidance free of legacy platform names", () => {
      const activeDocs = [
        "../../../../deploy/README.md",
        "../../../../packages/create-gmacko-app/README.md",
        "../../../../docs/ai/IMPLEMENTATION_PLAN.md",
        "../../../../docs/plans/2026-01-14-e2e-implementation.md",
        "../../../../docs/plans/2026-01-14-e2e-testing-plan.md",
      ].map((relativePath) =>
        fs.readFileSync(new URL(relativePath, import.meta.url), "utf8"),
      );

      for (const doc of activeDocs) {
        expect(doc).not.toContain("Neon");
        expect(doc).not.toContain("Vercel");
      }
    });

    it("should provide substantive current-era implementation plans", () => {
      const activePlans = [
        fs.readFileSync(
          new URL(
            "../../../../docs/ai/IMPLEMENTATION_PLAN.md",
            import.meta.url,
          ),
          "utf8",
        ),
        fs.readFileSync(
          new URL(
            "../../../../docs/plans/2026-01-14-e2e-implementation.md",
            import.meta.url,
          ),
          "utf8",
        ),
        fs.readFileSync(
          new URL(
            "../../../../docs/plans/2026-01-14-e2e-testing-plan.md",
            import.meta.url,
          ),
          "utf8",
        ),
      ];

      for (const plan of activePlans) {
        expect(plan).toContain("**Goal:**");
        expect(plan).toContain("**Architecture:**");
        expect(plan).toContain("**Tech Stack:**");
        expect(plan).toContain("ForgeGraph");
        expect(plan).toContain("Postgres");
      }
    });

    it("should keep the workers support matrix explicit about maturity by integration", () => {
      const developerExperience = fs.readFileSync(
        new URL("../../../../docs/ai/DEVELOPER_EXPERIENCE.md", import.meta.url),
        "utf8",
      );

      expect(developerExperience).toContain("Workers Integration Matrix");
      expect(developerExperience).toContain("Sentry");
      expect(developerExperience).toContain("PostHog");
      expect(developerExperience).toContain("Stripe");
      expect(developerExperience).toContain("stable");
      expect(developerExperience).toContain("experimental");
      expect(developerExperience).toContain("unsupported");
    });

    it("should scaffold a modern tooling baseline", async () => {
      const appName = generateAppName("modern-tooling");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "biome.json")).toBe(true);
      expect(fileExists(result.appPath, ".oxlintrc.json")).toBe(true);
      expect(fileExists(result.appPath, "lefthook.yml")).toBe(true);
      expect(fileExists(result.appPath, "commitlint.config.mjs")).toBe(true);
      expect(fileExists(result.appPath, "knip.json")).toBe(true);
      expect(fileExists(result.appPath, "scripts/doctor.sh")).toBe(true);
      expect(fileExists(result.appPath, "scripts/bootstrap-local.sh")).toBe(
        true,
      );

      const pkg = readJson<{
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>(result.appPath, "package.json");
      const setupScript = readFile(result.appPath, "scripts/setup.sh");
      const doctorScript = readFile(result.appPath, "scripts/doctor.sh");
      const bootstrapScript = readFile(
        result.appPath,
        "scripts/bootstrap-local.sh",
      );
      const envExample = readFile(result.appPath, ".env.example");
      const rootReadme = readFile(result.appPath, "README.md");

      expect(pkg.devDependencies?.["@biomejs/biome"]).toBeDefined();
      expect(pkg.devDependencies?.oxlint).toBeDefined();
      expect(pkg.devDependencies?.lefthook).toBeDefined();
      expect(pkg.devDependencies?.["@commitlint/cli"]).toBeDefined();
      expect(
        pkg.devDependencies?.["@commitlint/config-conventional"],
      ).toBeDefined();
      expect(pkg.devDependencies?.["@forgegraph/cli"]).toBe("^0.3.0");
      expect(pkg.devDependencies?.knip).toBeDefined();
      expect(pkg.scripts?.["lint:ox"]).toBeDefined();
      expect(pkg.scripts?.["format:check"]).toBeDefined();
      expect(pkg.scripts?.["format:fix"]).toBeDefined();
      expect(pkg.scripts?.doctor).toBe("./scripts/doctor.sh");
      expect(pkg.scripts?.["bootstrap:local"]).toBe(
        "./scripts/bootstrap-local.sh",
      );
      expect(pkg.scripts?.["check:fast"]).toBe("pnpm lint && pnpm typecheck");
      expect(pkg.scripts?.check).toBe(
        "pnpm check:fast && pnpm test && pnpm build",
      );
      expect(pkg.scripts?.["e2e:cli:full"]).toBe(
        "RUN_E2E=true pnpm --dir packages/create-gmacko-app vitest run src/__tests__/e2e.test.ts",
      );
      expect(pkg.scripts?.["release:cli:dry-run"]).toBeDefined();
      expect(pkg.scripts?.["check:release"]).toBe(
        "pnpm --dir packages/create-gmacko-app test && pnpm --dir packages/create-gmacko-app build && pnpm release:cli:dry-run",
      );
      expect(pkg.scripts?.["forge:init"]).toBe("forge init --full");
      expect(pkg.scripts?.["forge:doctor"]).toBe("forge doctor");
      expect(pkg.scripts?.["forge:status"]).toBe("forge status");
      expect(pkg.scripts?.["forge:diff"]).toBe("forge diff");
      expect(pkg.scripts?.["forge:apply"]).toBe("forge apply");
      expect(pkg.scripts?.["forge:pull"]).toBe("forge pull");
      expect(pkg.scripts?.["forge:deploy:staging"]).toBe(
        "forge deploy create staging --wait",
      );
      expect(pkg.scripts?.["forge:deploy:production"]).toBe(
        "forge deploy create production --wait",
      );
      expect(pkg.scripts?.["forge:stages"]).toBe("forge stage list");
      expect(pkg.scripts?.knip).toBeDefined();
      expect(pkg.scripts?.prepare).toBe(
        "git rev-parse --git-dir >/dev/null 2>&1 && lefthook install || true",
      );
      expect(setupScript).toContain('REQUIRED_NODE_VERSION="24"');
      expect(setupScript).toContain("pnpm bootstrap:local");
      expect(setupScript).toContain("@forgegraph/cli");
      expect(setupScript).toContain("pnpm forge:doctor");
      expect(bootstrapScript).toContain("pnpm doctor");
      expect(bootstrapScript).toContain("pnpm auth:generate");
      expect(bootstrapScript).toContain("pnpm db:generate");
      expect(bootstrapScript).toContain("pnpm db:push");
      expect(bootstrapScript).toContain("pnpm check:fast");
      expect(bootstrapScript).toContain("pnpm dev:emulate");
      expect(bootstrapScript).toContain(
        "ForgeGraph placeholders are still present in .forgegraph.yaml",
      );
      expect(bootstrapScript).toContain("pnpm forge:apply");
      expect(doctorScript).toContain(
        "Checking local development prerequisites",
      );
      expect(doctorScript).toContain("ForgeGraph CLI");
      expect(doctorScript).toContain("@forgegraph/cli");
      expect(doctorScript).toContain("Core app env values");
      expect(doctorScript).toContain("ForgeGraph deploy values");
      expect(doctorScript).toContain("Feature flags");
      expect(doctorScript).toContain("Background jobs");
      expect(doctorScript).toContain("Rate limits");
      expect(doctorScript).toContain("Compliance export hooks");
      expect(doctorScript).toContain("Cloudflare Workers env values");
      expect(doctorScript).toContain(
        ".forgegraph.yaml still has placeholder ForgeGraph values; update server, domains, and stage node IDs before deploying",
      );
      expect(doctorScript).toContain("Cloudflare Workers lane detected");
      expect(doctorScript).toContain("Wrangler CLI available");
      expect(doctorScript).toContain("Cloudflare Workers env values");
      expect(envExample).toContain("# CORE APP ENV");
      expect(envExample).toContain("# WEB APP ENV");
      expect(envExample).toContain("# MOBILE APP ENV");
      expect(envExample).toContain("# FORGEGRAPH DEPLOYMENT ENV");
      expect(envExample).toContain("# CLOUDFLARE WORKERS ENV");
      expect(envExample).toContain(
        'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gmacko_dev"',
      );
      expect(envExample).toContain('# AUTH_SECRET="replace-me-in-forgegraph"');
      expect(rootReadme).toContain("@forgegraph/cli");
      expect(
        fs.statSync(path.join(result.appPath, "scripts/setup.sh")).mode & 0o111,
      ).toBeTruthy();
      expect(
        fs.statSync(path.join(result.appPath, "scripts/doctor.sh")).mode &
          0o111,
      ).toBeTruthy();
      expect(
        fs.statSync(path.join(result.appPath, "scripts/bootstrap-local.sh"))
          .mode & 0o111,
      ).toBeTruthy();
    }, 120000);

    it("should scaffold Resend-aware doctor checks when email integration is enabled", async () => {
      const appName = generateAppName("resend-doctor");
      const result = await runCli({
        appName,
        flags: [
          "--yes",
          "--no-install",
          "--no-git",
          "--integrations",
          "email",
          "--email-provider",
          "resend",
        ],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      const doctorScript = readFile(result.appPath, "scripts/doctor.sh");
      const integrationsConfig = readFile(
        result.appPath,
        "packages/config/src/integrations.ts",
      );

      expect(integrationsConfig).toContain('provider: "resend"');
      expect(doctorScript).toContain("Resend email env values");
      expect(doctorScript).toContain("RESEND_API_KEY");
    }, 120000);

    it("should initialize a jj repo by default", async () => {
      const appName = generateAppName("jj-repo");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, ".jj")).toBe(true);
      expect(fileExists(result.appPath, ".git")).toBe(true);
    }, 120000);

    it("should scaffold without the legacy eslint and prettier stack", async () => {
      const appName = generateAppName("no-legacy-lint-stack");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "tooling/eslint")).toBe(false);
      expect(fileExists(result.appPath, "tooling/prettier")).toBe(false);
      expect(fileExists(result.appPath, "apps/nextjs/eslint.config.ts")).toBe(
        false,
      );
      expect(fileExists(result.appPath, "packages/db/eslint.config.ts")).toBe(
        false,
      );

      const rootPkg = readJson<{
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>(result.appPath, "package.json");
      const nextPkg = readJson<{
        scripts?: Record<string, string>;
        devDependencies?: Record<string, string>;
      }>(result.appPath, "apps/nextjs/package.json");

      expect(rootPkg.devDependencies?.prettier).toBeFalsy();
      expect(rootPkg.devDependencies?.["@gmacko/prettier-config"]).toBeFalsy();
      expect(rootPkg.scripts?.format).not.toContain("prettier");
      expect(rootPkg.scripts?.lint).not.toContain("eslint");

      expect(nextPkg.devDependencies?.eslint).toBeFalsy();
      expect(nextPkg.devDependencies?.prettier).toBeFalsy();
      expect(nextPkg.devDependencies?.["@gmacko/eslint-config"]).toBeFalsy();
      expect(nextPkg.devDependencies?.["@gmacko/prettier-config"]).toBeFalsy();
      expect(nextPkg.scripts?.format).toContain("biome");
      expect(nextPkg.scripts?.lint).toContain("oxlint");
    }, 120000);
  });

  it("keeps the template release workflow scoped to the CLI package", () => {
    const releaseWorkflow = fs.readFileSync(
      path.resolve(process.cwd(), "../../.github/workflows/release.yml"),
      "utf8",
    );

    expect(releaseWorkflow).toContain(
      "pnpm --dir packages/create-gmacko-app test",
    );
    expect(releaseWorkflow).toContain(
      "pnpm --dir packages/create-gmacko-app build",
    );
    expect(releaseWorkflow).toContain("pnpm release:cli:dry-run");
    expect(releaseWorkflow).not.toContain("pnpm check:release");
    expect(releaseWorkflow).not.toContain(
      "pnpm --filter create-gmacko-app test",
    );
  });

  it("keeps the CLI E2E workflow aligned with the current template baseline", () => {
    const e2eWorkflow = fs.readFileSync(
      path.resolve(process.cwd(), "../../.github/workflows/cli-e2e.yml"),
      "utf8",
    );

    expect(e2eWorkflow).toContain('node-version-file: ".nvmrc"');
    expect(e2eWorkflow).not.toContain("node-version: 22");
    expect(e2eWorkflow).not.toContain("2>&1 || true");
    expect(e2eWorkflow).toContain("pnpm doctor");
    expect(e2eWorkflow).toContain("pnpm check:fast");
    expect(e2eWorkflow).toContain(
      "pnpm --dir packages/create-gmacko-app build",
    );
    expect(e2eWorkflow).toContain('AUTH_GITHUB_ID="test-github-client-id"');
    expect(e2eWorkflow).toContain(
      'AUTH_GITHUB_SECRET="test-github-client-secret"',
    );
    expect(e2eWorkflow).toContain(
      'CLOUDFLARE_ACCOUNT_ID="test-cloudflare-account"',
    );
    expect(e2eWorkflow).toContain(
      'CLOUDFLARE_API_TOKEN="test-cloudflare-token"',
    );
    expect(e2eWorkflow).toContain(
      'EXPO_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"',
    );
    expect(e2eWorkflow).toContain("pnpm --filter @gmacko/nextjs build");
    expect(e2eWorkflow).toContain("pnpm --filter @gmacko/tanstack-start build");
    expect(e2eWorkflow).toContain("pnpm --filter @gmacko/expo typecheck");
    expect(e2eWorkflow).toContain(
      "pnpm --filter @gmacko/expo exec expo start --dev-client --help",
    );
    expect(e2eWorkflow).toContain(
      "pnpm --filter @gmacko/expo exec expo config --json",
    );
    expect(e2eWorkflow).toContain(
      "pnpm --filter @gmacko/nextjs deploy:cloudflare:staging",
    );
    expect(e2eWorkflow).toContain("--trpc-operators");
    expect(e2eWorkflow).toContain("pnpm trpc:ops -- --help");
    expect(e2eWorkflow).toContain("Operator API env values");
    expect(e2eWorkflow).toContain('GMACKO_API_URL="http://localhost:3000"');
    expect(e2eWorkflow).toContain('GMACKO_API_KEY="test-gmacko-api-key"');
    expect(e2eWorkflow).toContain("pnpm exec forge --version");
    expect(e2eWorkflow).toContain("pnpm forge:stages");
    expect(e2eWorkflow).toContain("pnpm forge:deploy:staging");
    expect(e2eWorkflow).toContain("pnpm auth:generate");
    expect(e2eWorkflow).toContain("pnpm db:generate");
    expect(e2eWorkflow).toContain(
      "grep 'status: \"healthy\"' apps/nextjs/src/app/api/health/route.ts",
    );
    expect(e2eWorkflow).toContain("Cloudflare Workers credentials present");
    expect(e2eWorkflow).toContain("fake-wrangler deploy --env staging");
    expect(e2eWorkflow).toContain('RUN_E2E: "true"');
    expect(e2eWorkflow).toContain(
      "pnpm --dir packages/create-gmacko-app vitest run src/__tests__/e2e.test.ts",
    );
  });

  it("keeps repo formatting focused on first-party files", () => {
    const biomeConfig = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), "../../biome.json"), "utf8"),
    ) as {
      files?: {
        includes?: string[];
      };
      css?: {
        parser?: {
          tailwindDirectives?: boolean;
        };
      };
    };
    const compiledTsconfig = fs.readFileSync(
      path.resolve(
        process.cwd(),
        "../../tooling/typescript/compiled-package.json",
      ),
      "utf8",
    );
    const baseTsconfig = fs.readFileSync(
      path.resolve(process.cwd(), "../../tooling/typescript/base.json"),
      "utf8",
    );

    expect(biomeConfig.files?.includes).toContain("!**/.claude");
    expect(biomeConfig.css?.parser?.tailwindDirectives).toBe(true);
    expect(() => JSON.parse(compiledTsconfig)).not.toThrow();
    expect(() => JSON.parse(baseTsconfig)).not.toThrow();
  });

  it("keeps local release artifacts out of git status", () => {
    const gitignore = fs.readFileSync(
      path.resolve(process.cwd(), "../../.gitignore"),
      "utf8",
    );

    expect(gitignore).toContain(".artifacts");
  });

  it("keeps repo lint noise focused on first-party files", () => {
    const oxlintConfig = JSON.parse(
      fs.readFileSync(
        path.resolve(process.cwd(), "../../.oxlintrc.json"),
        "utf8",
      ),
    ) as {
      ignorePatterns?: string[];
    };
    const indexSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/index.ts"),
      "utf8",
    );
    const promptsSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/prompts.ts"),
      "utf8",
    );
    const testSource = fs.readFileSync(
      path.resolve(process.cwd(), "src/__tests__/scaffold.test.ts"),
      "utf8",
    );
    const testImportBlock = testSource.split("\n").slice(0, 4).join("\n");

    expect(oxlintConfig.ignorePatterns).toContain(".claude/**");
    expect(indexSource).not.toContain("DEFAULT_INTEGRATIONS");
    expect(indexSource).not.toContain("storageProvider?: string");
    expect(promptsSource).not.toContain("PlatformConfig");
    expect(testImportBlock).not.toContain("beforeEach");
  });

  describe("platform options", () => {
    it("should exclude web app when --no-web is passed", async () => {
      const appName = generateAppName("no-web");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--no-web"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "apps/nextjs")).toBe(false);
    }, 120000);

    it("should exclude mobile app when --no-mobile is passed", async () => {
      const appName = generateAppName("no-mobile");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--no-mobile"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "apps/expo")).toBe(false);
    }, 120000);

    it("should include tanstack-start when --tanstack-start is passed", async () => {
      const appName = generateAppName("with-tanstack");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--tanstack-start"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      for (const file of EXPECTED_FILES.withTanstackStart) {
        expect(fileExists(result.appPath, file)).toBe(true);
      }
    }, 120000);

    it("should exclude AI when --no-ai is passed", async () => {
      const appName = generateAppName("no-ai");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git", "--no-ai"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, ".opencode")).toBe(false);
      expect(fileExists(result.appPath, "opencode.json")).toBe(false);
      expect(fileExists(result.appPath, ".claude")).toBe(false);
      expect(fileExists(result.appPath, "CLAUDE.md")).toBe(false);
      expect(fileExists(result.appPath, "docs/ai")).toBe(false);
    }, 120000);
  });

  describe("integration options", () => {
    it("should configure integrations via --integrations flag", async () => {
      const appName = generateAppName("custom-integrations");
      const result = await runCli({
        appName,
        flags: [
          "--yes",
          "--no-install",
          "--no-git",
          "--integrations",
          "sentry,posthog,stripe",
        ],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      // Check integrations.ts was updated
      const integrationsPath = path.join(
        result.appPath,
        "packages/config/src/integrations.ts",
      );
      const integrationsContent = fs.readFileSync(integrationsPath, "utf-8");

      expect(integrationsContent).toContain("sentry: true");
      expect(integrationsContent).toContain("posthog: true");
      expect(integrationsContent).toContain("stripe: true");
    }, 120000);

    it("should prune unused packages when --prune is passed", async () => {
      const appName = generateAppName("pruned");
      const result = await runCli({
        appName,
        flags: [
          "--yes",
          "--no-install",
          "--no-git",
          "--no-mobile",
          "--no-ai",
          "--vinext",
          "--prune",
          "--integrations",
          "", // No integrations = prune all optional packages
        ],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      // These packages should be removed when their integrations are disabled
      expect(fileExists(result.appPath, "packages/monitoring")).toBe(false);
      expect(fileExists(result.appPath, "packages/analytics")).toBe(false);
      expect(fileExists(result.appPath, "packages/payments")).toBe(false);
      expect(
        fileExists(result.appPath, "apps/nextjs/sentry.client.config.ts"),
      ).toBe(false);
      expect(
        fileExists(result.appPath, "apps/nextjs/sentry.edge.config.ts"),
      ).toBe(false);
      expect(
        fileExists(result.appPath, "apps/nextjs/sentry.server.config.ts"),
      ).toBe(false);

      const nextProviders = readFile(
        result.appPath,
        "apps/nextjs/src/app/providers.tsx",
      );
      const nextErrorPage = readFile(
        result.appPath,
        "apps/nextjs/src/app/error.tsx",
      );
      const nextGlobalError = readFile(
        result.appPath,
        "apps/nextjs/src/app/global-error.tsx",
      );
      const nextErrorBoundary = readFile(
        result.appPath,
        "apps/nextjs/src/components/error-boundary.tsx",
      );
      const nextInstrumentation = readFile(
        result.appPath,
        "apps/nextjs/src/instrumentation.ts",
      );

      expect(nextProviders).not.toContain("@gmacko/analytics/web");
      expect(nextErrorPage).not.toContain("@gmacko/monitoring/web");
      expect(nextGlobalError).not.toContain("@gmacko/monitoring/web");
      expect(nextErrorBoundary).not.toContain("@gmacko/monitoring/web");
      expect(nextInstrumentation).not.toContain("sentry.server.config");
      expect(nextInstrumentation).not.toContain("sentry.edge.config");
    }, 120000);
  });

  describe("package scope", () => {
    it("should replace package scope when --package-scope is passed", async () => {
      const appName = generateAppName("custom-scope");
      const result = await runCli({
        appName,
        flags: [
          "--yes",
          "--no-install",
          "--no-git",
          "--package-scope",
          "@myorg",
        ],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);

      // Check that @gmacko was replaced with @myorg
      const apiPkg = readJson<{ name: string }>(
        result.appPath,
        "packages/api/package.json",
      );
      expect(apiPkg.name).toBe("@myorg/api");

      const dbPkg = readJson<{ name: string }>(
        result.appPath,
        "packages/db/package.json",
      );
      expect(dbPkg.name).toBe("@myorg/db");
    }, 120000);
  });

  describe("manifest file", () => {
    it("should create gmacko.integrations.json manifest", async () => {
      const appName = generateAppName("with-manifest");
      const result = await runCli({
        appName,
        flags: ["--yes", "--no-install", "--no-git"],
        cwd: tempDir,
      });

      appsToClean.push(result.appPath);

      expect(result.exitCode).toBe(0);
      expect(fileExists(result.appPath, "gmacko.integrations.json")).toBe(true);

      const manifest = readJson<{
        preset: string;
        integrations: Record<string, unknown>;
        platforms: Record<string, boolean>;
        scaffoldedAt: string;
        packageScope: string;
      }>(result.appPath, "gmacko.integrations.json");

      expect(manifest.preset).toBeDefined();
      expect(manifest.integrations).toBeDefined();
      expect(manifest.platforms).toBeDefined();
      expect(manifest.scaffoldedAt).toBeDefined();
      expect(manifest.packageScope).toBe("@gmacko");
    }, 120000);
  });
});
