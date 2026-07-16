import { expo } from "@better-auth/expo";
import { sso } from "@better-auth/sso";
import { lt } from "@gmacko/db";
import { db } from "@gmacko/db/client";
import type { UserRole, WorkspaceRole } from "@gmacko/db/schema";
import { deviceCode } from "@gmacko/db/schema";
import { createLogger } from "@gmacko/logging";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import {
  bearer,
  deviceAuthorization,
  magicLink,
  oAuthProxy,
} from "better-auth/plugins";

const log = createLogger({ module: "auth" });

export { parseSsoTrustedIssuers } from "./sso-issuers";

export function isPlatformAdminRole(
  role: UserRole | null | undefined,
): role is "admin" {
  return role === "admin";
}

export function canManageWorkspace(
  role: WorkspaceRole | null | undefined,
): boolean {
  return role === "owner" || role === "admin";
}

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  githubClientId: string;
  githubClientSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  appleClientId?: string;
  appleClientSecret?: string;
  appleBundleIdentifier?: string;
  githubUrl?: string;
  githubApiUrl?: string;
  googleUrl?: string;
  googleTokenUrl?: string;
  appleUrl?: string;
  bypassMagicLink?: boolean;
  sendMagicLinkEmail?: (params: {
    email: string;
    url: string;
  }) => Promise<void>;
  /**
   * Origins of bring-your-own SSO identity providers (issuer base URLs).
   * OIDC discovery rejects issuers outside better-auth's trusted origins, so
   * each customer IdP origin must be allow-listed here (usually via the
   * AUTH_SSO_TRUSTED_ISSUERS env var).
   */
  ssoTrustedIssuers?: string[];
  extraPlugins?: TExtraPlugins;
}) {
  const ghUrl = options.githubUrl ?? "https://github.com";
  const ghApiUrl = options.githubApiUrl ?? "https://api.github.com";
  const googleUrl = options.googleUrl ?? "https://accounts.google.com";
  const googleTokenUrl =
    options.googleTokenUrl ?? "https://oauth2.googleapis.com/token";
  const appleUrl = options.appleUrl ?? "https://appleid.apple.com";

  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    user: {
      additionalFields: {
        // Platform-level role (see `userRoleEnum` in @gmacko/db). Declared so
        // better-auth carries it on session.user and plugin callbacks (the
        // sso plugin's providersLimit gate reads it). Not client-writable.
        role: {
          type: "string",
          required: false,
          defaultValue: "user",
          input: false,
        },
      },
    },
    plugins: [
      oAuthProxy({
        productionURL: options.productionUrl,
      }),
      expo(),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          if (options.bypassMagicLink) {
            log.info({ email, url }, "magic link generated (bypass mode)");
            return;
          }
          if (options.sendMagicLinkEmail) {
            await options.sendMagicLinkEmail({ email, url });
          }
        },
      }),
      // Lets mobile/CLI clients authenticate with `Authorization: Bearer
      // <session token>` — the credential the device flow below hands out.
      // Note: this makes any raw session token directly replayable as a header
      // across every app using initAuth, so treat session-token leaks (DB
      // snapshots, logs) as credential leaks. requireSignature can't be
      // enabled here because the device grant returns the unsigned token.
      bearer(),
      // RFC 8628 device-authorization grant. Powers both mobile pairing paths:
      // QR (web starts + approves a flow, phone redeems the device code) and
      // user-code entry (phone starts a flow, user approves at /device).
      deviceAuthorization({
        expiresIn: "15m",
        interval: "5s",
      }),
      // Bring-your-own SSO: OIDC providers registered at runtime and matched
      // by email domain. Registration is restricted to platform admins.
      sso({
        providersLimit: (user) =>
          isPlatformAdminRole((user as { role?: UserRole }).role) ? 10 : 0,
      }),
      ...(options.extraPlugins ?? []),
    ],
    socialProviders: {
      github: {
        clientId: options.githubClientId,
        clientSecret: options.githubClientSecret,
        authorizationEndpoint: `${ghUrl}/login/oauth/authorize`,
        tokenEndpoint: `${ghUrl}/login/oauth/access_token`,
        userInfoEndpoint: `${ghApiUrl}/user`,
      },
      google: {
        clientId: options.googleClientId,
        clientSecret: options.googleClientSecret,
        authorizationEndpoint: `${googleUrl}/o/oauth2/v2/auth`,
        tokenEndpoint: googleTokenUrl,
      },
      ...(options.appleClientId && options.appleClientSecret
        ? {
            apple: {
              clientId: options.appleClientId,
              clientSecret: options.appleClientSecret,
              appBundleIdentifier: options.appleBundleIdentifier,
              authorizationEndpoint: `${appleUrl}/auth/authorize`,
              tokenEndpoint: `${appleUrl}/auth/token`,
              jwksEndpoint: `${appleUrl}/auth/keys`,
            },
          }
        : {}),
    },
    trustedOrigins: [
      "expo://",
      appleUrl,
      "https://gmacko.localhost",
      // Note: better-auth also treats trusted origins as valid redirect
      // targets, so SSO issuer entries broaden more than OIDC discovery —
      // keep the allow-list to exact IdP origins.
      ...(options.ssoTrustedIssuers ?? []),
    ],
    hooks: {
      // The deviceAuthorization plugin only deletes a device-code row when
      // that specific code is polled after expiry, so abandoned flows would
      // otherwise accumulate forever. Sweep expired rows whenever a new flow
      // starts — amortized cleanup with no cron dependency.
      after: createAuthMiddleware(async (ctx) => {
        if (ctx.path === "/device/code") {
          try {
            await db
              .delete(deviceCode)
              .where(lt(deviceCode.expiresAt, new Date()));
          } catch (err) {
            log.warn({ err }, "expired device-code sweep failed");
          }
        }
      }),
    },
    onAPIError: {
      onError(error, ctx) {
        log.error({ err: error, context: ctx }, "better-auth API error");
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
