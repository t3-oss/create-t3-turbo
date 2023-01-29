import { getEnv } from "@acme/env";

export const env = getEnv(["NODE_ENV", "NEXTAUTH_URL", "DATABASE_URL", "TEST"]);
