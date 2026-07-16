# QR Device Pairing + Bring-Your-Own SSO

Date: 2026-07-16
Status: implemented

Ports the mobile QR-code login and BYO SSO patterns from kanbanger
(linear-clone) onto the template's better-auth stack, using better-auth's
native plugins instead of kanbanger's hand-rolled tables.

## What was added

### 1. Mobile QR / device pairing (RFC 8628 device-authorization grant)

Plugins: `deviceAuthorization` + `bearer` (both from `better-auth/plugins`),
wired in `packages/auth/src/index.ts`. New `device_code` table in
`packages/db/src/auth-schema.ts`.

Two pairing paths, both ending with the phone holding a better-auth session
token that it sends as `Authorization: Bearer <token>` (the `bearer` plugin
resolves it server-side for both better-auth endpoints and tRPC, whose
context already forwards request headers to `auth.api.getSession`):

- **QR scan (web pre-approves).** Settings → "Pair Mobile Device"
  (`apps/nextjs/src/app/settings/_components/pair-device.tsx`) starts a
  device flow and immediately approves it as the signed-in user, then renders
  a QR encoding `{ url, code: device_code }`. The QR carries a short-lived
  (15 min), single-use pairing code — never a credential. The mobile app
  scans it and redeems the code at `/api/auth/device/token` for the session
  token; replay is rejected.
- **User code (phone initiates).** The phone requests a flow, displays
  `XXXX-XXXX`, and polls. The user approves at `/device`
  (`apps/nextjs/src/app/device/page.tsx`), which better-auth links via
  `verification_uri_complete`.

Expo side (`apps/expo/src/app/pair.tsx`): `expo-camera` scanner + user-code
mode. The token is stored in SecureStore (`utils/session-store.ts`) and
injected as a Bearer header by both the auth client (`fetchOptions.auth` in
`utils/auth.ts`, so `useSession()` works) and the tRPC client
(`utils/api.tsx`). Sign-out clears it. `PAIRING_CLIENT_ID = "mobile-app"` on
both sides.

Kanbanger's third mode (paste an API key) was intentionally dropped: `gmk_`
API keys authenticate tRPC but are not better-auth sessions, so they can't
drive `useSession()`. API keys remain available for programmatic access.

### 2. Bring-your-own SSO (OIDC)

Plugin: `sso` from `@better-auth/sso` (same version as the pinned better-auth
build). New `sso_provider` table. Providers are registered at runtime and
matched to sign-ins by email domain — e.g. register domain `gmacko.com` and
any `@gmacko.com` address entered in the login form is routed to that IdP.

- **Login**: "Continue with SSO" email form on the auth showcase
  (`apps/nextjs/src/app/_components/sso-form.tsx`) →
  `authClient.signIn.sso({ email })`.
- **Admin registration**: `/admin/sso`
  (`apps/nextjs/src/app/admin/sso/_components/sso-providers.tsx`) registers
  providerId / email domain / issuer / client credentials. Endpoints are
  resolved from the issuer's `/.well-known/openid-configuration`.
- **Authorization**: registration is gated server-side via the sso plugin's
  `providersLimit` — `0` (disabled) for regular users, `10` for platform
  admins. This required declaring the `role` column as a better-auth
  `user.additionalFields` entry so plugin callbacks can see it.
- **Issuer allow-list**: better-auth refuses OIDC discovery against origins
  outside `trustedOrigins` (SSRF guard). Operators list their IdP origins in
  `AUTH_SSO_TRUSTED_ISSUERS` (comma-separated, see `.env.example`), parsed by
  `parseSsoTrustedIssuers()` and plumbed through
  `initAuth({ ssoTrustedIssuers })` in both the Next.js and TanStack Start
  auth servers. Caveat: better-auth also treats trusted origins as valid
  redirect targets, so entries broaden more than discovery — allow-list exact
  IdP origins only, never wildcards.

## Schema notes

- `device_code.deviceCode` / `userCode` are unique (single-use credentials,
  and the plugin looks both up on every poll/approval — uniqueness doubles as
  the hot-path index). `sso_provider.domain` is indexed for the per-sign-in
  provider lookup.
- `device_code.userId` cascades on user deletion; `sso_provider.userId` (the
  registering admin) is `set null` instead, so deleting an admin account
  doesn't lock the whole email domain out of SSO.
- The deviceAuthorization plugin only deletes a code row when that specific
  code is polled after expiry, so abandoned flows would accumulate. initAuth
  sweeps expired rows whenever a new device flow starts (after-hook on
  `/device/code`) — amortized cleanup, no cron.
- **Upgrade note:** existing checkouts must run `pnpm db:push` before the new
  login-page SSO form / pairing UI can work; without it those surfaces hit
  missing `sso_provider` / `device_code` relations.

## Shared constants

`PAIRING_CLIENT_ID` lives in `@gmacko/config` — the web pairing panel, the
Expo pairing screen, and the auth-flow tests import the same value; the token
endpoint rejects redemptions whose `client_id` doesn't match the code's.

## Schema-generation caveat

`pnpm auth:generate` (better-auth CLI) regenerates
`packages/db/src/auth-schema.ts` in a different style than the checked-in
file and previously dropped the hand-added `role` column (now fixed by the
`additionalFields` declaration). The plugin tables were added by hand in the
existing file style, with drift guards in
`packages/db/src/__tests__/schema.test.ts` asserting the exact table/field
names the plugins expect.

## Known follow-ups (scaffold scope)

The device-pairing and SSO **UI** currently lives only in `apps/nextjs`
(`/device`, the settings pairing panel, the SSO login form, `/admin/sso`); the
server plugins live in shared `packages/auth` for all apps. Two scaffold-prune
combinations are therefore incomplete and want a follow-up:

- **web pruned, mobile kept**: the Expo app still shows "Sign in with QR Code"
  and the device-code verification link, but there's no web `/device` page to
  approve at. Either add parity routes to `apps/tanstack-start` or teach the
  scaffolder to disable the mobile pairing entry points.
- **mobile pruned, web kept**: the settings "Pair Mobile Device" panel and the
  deviceAuthorization plugin ship for a mobile app that doesn't exist.

Neither affects the default full scaffold. Tracked in `TODOS.md`.

## Verification

`packages/auth/src/__tests__/auth-flows.test.ts` (`pnpm -F @gmacko/auth test`,
part of the workspace `turbo run test` graph) exercises everything end-to-end
against the real `initAuth()` instance, the emulate PGlite database, and a
stub OIDC IdP on a dynamic port: bearer resolution, QR pairing (mint →
approve → redeem → replay rejected with `invalid_grant`, client_id mismatch
rejected), user-code flow (`authorization_pending` → deny → `access_denied`),
expired-code rejection (`expired_token`, via backdating), and SSO (non-admin
403, role mass-assignment blocked, untrusted issuer
`discovery_untrusted_origin`, admin registration, domain routing, unknown
domain rejected). `apps/expo/src/utils/pairing.test.ts` covers the QR payload
parser; `packages/db/src/__tests__/schema.test.ts` guards the exact table
shapes the plugins expect.
