import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, oAuthProxy, organization, twoFactor } from "better-auth/plugins";

import { db } from "@gmacko/db/client";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  discordClientId: string;
  discordClientSecret: string;

  /** SAML/SSO IdP configuration (optional — enable for enterprise customers) */
  saml?: {
    /** SAML IdP Metadata URL or XML string */
    issuer: string;
    /** SAML callback URL (defaults to /api/auth/saml/callback) */
    callbackUrl?: string;
  };

  extraPlugins?: TExtraPlugins;
}) {
  // ── Build plugin list ──────────────────────────────────────────────────
  const plugins: BetterAuthPlugin[] = [
    oAuthProxy({
      productionURL: options.productionUrl,
    }),
    expo(),

    // Admin plugin — provides impersonation, ban/unban, user management
    admin(),

    // Organization plugin — multi-tenancy with teams and invites
    organization({
      allowUserToCreateOrganization: true,
    }),

    // Two-factor authentication — TOTP (authenticator apps)
    twoFactor({
      issuer: process.env.APP_NAME ?? "Gmacko",
    }),
  ];

  // Add any extra plugins passed by the consumer
  if (options.extraPlugins) {
    plugins.push(...options.extraPlugins);
  }

  // ── Social providers ───────────────────────────────────────────────────
  const socialProviders: BetterAuthOptions["socialProviders"] = {
    discord: {
      clientId: options.discordClientId,
      clientSecret: options.discordClientSecret,
      redirectURI: `${options.productionUrl}/api/auth/callback/discord`,
    },
  };

  // Add Google OAuth if configured
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    socialProviders.google = {
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      redirectURI: `${options.productionUrl}/api/auth/callback/google`,
    };
  }

  // Add GitHub OAuth if configured
  if (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET) {
    socialProviders.github = {
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
      redirectURI: `${options.productionUrl}/api/auth/callback/github`,
    };
  }

  // Add Microsoft / Azure AD (Entra ID) if configured
  if (process.env.AUTH_MICROSOFT_ID && process.env.AUTH_MICROSOFT_SECRET) {
    socialProviders.microsoft = {
      clientId: process.env.AUTH_MICROSOFT_ID,
      clientSecret: process.env.AUTH_MICROSOFT_SECRET,
      redirectURI: `${options.productionUrl}/api/auth/callback/microsoft`,
    };
  }

  // ── Better Auth config ─────────────────────────────────────────────────
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    plugins,
    socialProviders,
    trustedOrigins: ["expo://"],

    // Session configuration
    session: {
      // 7-day session with automatic refresh
      expiresIn: 60 * 60 * 24 * 7,
      // Refresh when less than 1 day remaining
      updateAge: 60 * 60 * 24,
    },

    // Account configuration
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google", "github", "microsoft", "discord"],
      },
    },

    // Email & password configuration
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: process.env.NODE_ENV === "production",
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },

    // Logging
    onAPIError: {
      onError(error: unknown, ctx: unknown) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
