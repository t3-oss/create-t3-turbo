/**
 * End-to-end verification of the device-authorization (QR pairing) and
 * bring-your-own SSO flows against the real initAuth() instance and a live
 * Postgres. This is a MANUAL script, not part of `pnpm test`: it needs a
 * Postgres the emulate PGlite CI stack can't schema-push into.
 *
 * Point DATABASE_URL at a scratch database with the schema pushed
 * (`pnpm db:push`), never at production — it inserts a throwaway user and
 * SSO provider.
 *
 *   pnpm -F @gmacko/auth verify:flows          # uses DATABASE_URL from .env
 *   DATABASE_URL=postgres://… pnpm -F @gmacko/auth exec tsx script/verify-flows.ts
 */

import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { PAIRING_CLIENT_ID } from "@gmacko/config";

const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";

// Unique per run so the script can be re-run against the same database.
const runId = Date.now().toString(36);
const ssoDomain = `sso-${runId}.example`;

let pass = 0;
let fail = 0;
function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`, detail ?? "");
  }
}

interface ApiError {
  statusCode?: number;
  body?: { error?: string; code?: string; message?: string };
}
/** Run an api call, returning its APIError on rejection (or null on success). */
async function errorOf(promise: Promise<unknown>): Promise<ApiError | null> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error as ApiError;
  }
}

async function main() {
  // Stub OIDC IdP on a dynamic port for SSO registration/discovery.
  const idp = createServer((req, res) => {
    if (req.url?.startsWith("/.well-known/openid-configuration")) {
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          issuer: idpOrigin,
          authorization_endpoint: `${idpOrigin}/authorize`,
          token_endpoint: `${idpOrigin}/token`,
          userinfo_endpoint: `${idpOrigin}/userinfo`,
          jwks_uri: `${idpOrigin}/jwks`,
          response_types_supported: ["code"],
          subject_types_supported: ["public"],
          id_token_signing_alg_values_supported: ["RS256"],
          scopes_supported: ["openid", "profile", "email"],
          token_endpoint_auth_methods_supported: [
            "client_secret_post",
            "client_secret_basic",
          ],
        }),
      );
      return;
    }
    res.statusCode = 404;
    res.end();
  });
  await new Promise<void>((resolve) => idp.listen(0, "127.0.0.1", resolve));
  const idpOrigin = `http://127.0.0.1:${(idp.address() as AddressInfo).port}`;

  try {
    const { initAuth } = await import("../src/index");
    const { db } = await import("@gmacko/db/client");
    const { user: userTable } = await import("@gmacko/db/schema");
    const { eq } = await import("@gmacko/db");

    const auth = initAuth({
      baseUrl: "http://localhost:3000",
      productionUrl: "http://localhost:3000",
      secret: "verify-secret-verify-secret-verify-secret",
      githubClientId: "x",
      githubClientSecret: "x",
      googleClientId: "x",
      googleClientSecret: "x",
      ssoTrustedIssuers: [idpOrigin],
    });

    // Seed a signed-in user the way the app would see one.
    const ctx = await auth.$context;
    const alice = await ctx.internalAdapter.createUser({
      email: `alice@${ssoDomain}`,
      name: "Alice",
      emailVerified: true,
    });
    const session = await ctx.internalAdapter.createSession(alice.id);
    const aliceHeaders = new Headers({
      authorization: `Bearer ${session.token}`,
    });

    console.log("\nbearer plugin");
    const s = await auth.api.getSession({ headers: aliceHeaders });
    check("session resolves from Authorization: Bearer <token>", !!s?.user, s);

    console.log("\ndevice-authorization: QR pairing (web pre-approves)");
    const code = await auth.api.deviceCode({
      body: { client_id: PAIRING_CLIENT_ID },
    });
    check(
      "POST /device/code returns device_code + user_code",
      !!code.device_code && !!code.user_code,
      code,
    );
    check(
      "verification_uri points at /device on the app origin",
      code.verification_uri === "http://localhost:3000/device",
      code.verification_uri,
    );

    await auth.api.deviceApprove({
      body: { userCode: code.user_code },
      headers: aliceHeaders,
    });
    const token = await auth.api.deviceToken({
      body: {
        grant_type: DEVICE_GRANT,
        device_code: code.device_code,
        client_id: PAIRING_CLIENT_ID,
      },
    });
    check(
      "redeeming the pairing code returns a session token",
      !!token.access_token,
    );

    const paired = await auth.api.getSession({
      headers: new Headers({ authorization: `Bearer ${token.access_token}` }),
    });
    check(
      "paired token authenticates as the approving user",
      paired?.user.email === `alice@${ssoDomain}`,
      paired?.user,
    );

    const replay = await errorOf(
      auth.api.deviceToken({
        body: {
          grant_type: DEVICE_GRANT,
          device_code: code.device_code,
          client_id: PAIRING_CLIENT_ID,
        },
      }),
    );
    check(
      "pairing code is single-use (replay rejected with invalid_grant)",
      replay?.body?.error === "invalid_grant",
      replay?.body,
    );

    console.log("\ndevice-authorization: user-code flow (device initiates)");
    const code2 = await auth.api.deviceCode({
      body: { client_id: PAIRING_CLIENT_ID },
    });
    const pending = await errorOf(
      auth.api.deviceToken({
        body: {
          grant_type: DEVICE_GRANT,
          device_code: code2.device_code,
          client_id: PAIRING_CLIENT_ID,
        },
      }),
    );
    check(
      "polling before approval returns authorization_pending",
      pending?.body?.error === "authorization_pending",
      pending?.body,
    );
    await auth.api.deviceDeny({
      body: { userCode: code2.user_code },
      headers: aliceHeaders,
    });
    // Respect the polling interval reported by the server so the next poll
    // isn't rejected with slow_down instead of the denial.
    await new Promise((r) => setTimeout(r, (code2.interval + 0.5) * 1000));
    const denied = await errorOf(
      auth.api.deviceToken({
        body: {
          grant_type: DEVICE_GRANT,
          device_code: code2.device_code,
          client_id: PAIRING_CLIENT_ID,
        },
      }),
    );
    check(
      "denied code is rejected with access_denied",
      denied?.body?.error === "access_denied",
      denied?.body,
    );

    console.log("\nsso: bring-your-own OIDC provider");
    const providerBody = {
      providerId: `verify-idp-${runId}`,
      domain: ssoDomain,
      oidcConfig: { clientId: "cid", clientSecret: "csecret" },
    };
    const asUser = await errorOf(
      auth.api.registerSSOProvider({
        body: { ...providerBody, issuer: idpOrigin },
        headers: aliceHeaders,
      }),
    );
    check(
      "non-admin cannot register a provider (403, providersLimit=0)",
      asUser?.statusCode === 403,
      asUser,
    );

    await db
      .update(userTable)
      .set({ role: "admin" })
      .where(eq(userTable.id, alice.id));

    const untrusted = await errorOf(
      auth.api.registerSSOProvider({
        body: {
          ...providerBody,
          providerId: `untrusted-${runId}`,
          issuer: "http://untrusted-idp.example",
        },
        headers: aliceHeaders,
      }),
    );
    check(
      "untrusted issuer is rejected (discovery_untrusted_origin)",
      untrusted?.body?.code === "discovery_untrusted_origin",
      untrusted?.body,
    );

    const registered = await auth.api.registerSSOProvider({
      body: { ...providerBody, issuer: idpOrigin },
      headers: aliceHeaders,
    });
    check("platform admin can register a provider", !!registered);

    const signIn = await auth.api.signInSSO({
      body: { email: `bob@${ssoDomain}`, callbackURL: "/" },
    });
    check(
      "sign-in with an email on the registered domain routes to the IdP",
      typeof signIn.url === "string" &&
        signIn.url.startsWith(`${idpOrigin}/authorize`),
      signIn.url,
    );

    const noProvider = await errorOf(
      auth.api.signInSSO({
        body: { email: `carol@unknown-${runId}.example`, callbackURL: "/" },
      }),
    );
    check(
      "sign-in with an unregistered domain is rejected",
      noProvider !== null,
      noProvider,
    );
  } finally {
    await new Promise<void>((resolve) => idp.close(() => resolve()));
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
