import type { BetterAuthPlugin } from "better-auth";

import { createApp } from "@acme/api";
import { initAuth } from "@acme/auth";
import { initDb } from "@acme/db";

import { env } from "./env";

const orm = await initDb();
const auth = initAuth<BetterAuthPlugin[]>({
  baseUrl: env.BETTER_AUTH_URL,
  productionUrl: env.BETTER_AUTH_URL,
  secret: env.AUTH_SECRET,
  discordClientId: env.AUTH_DISCORD_ID,
  discordClientSecret: env.AUTH_DISCORD_SECRET,
});

createApp({ auth, orm }).listen(env.PORT, () => {
  console.log(`🦊 Elysia running at http://localhost:${env.PORT}`);
});
