import "varlock/auto-load";

import type { BetterAuthPlugin } from "better-auth";
import { ENV } from "varlock/env";

import { createApp } from "@acme/api";
import { initAuth } from "@acme/auth";
import { initDb } from "@acme/db";

const orm = await initDb();
const auth = await initAuth<BetterAuthPlugin[]>({
  baseUrl: ENV.BETTER_AUTH_URL,
  productionUrl: ENV.BETTER_AUTH_URL,
  secret: ENV.AUTH_SECRET,
  discordClientId: ENV.AUTH_DISCORD_ID ?? "",
  discordClientSecret: ENV.AUTH_DISCORD_SECRET ?? "",
});

createApp({ auth, orm }).listen(ENV.PORT, () => {
  console.log(`🦊 Elysia running at http://localhost:${ENV.PORT}`);
});
