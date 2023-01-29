import { z } from "zod";

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const server = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET:
    process.env.NODE_ENV === "production"
      ? z.string().min(1)
      : z.string().min(1).optional(),
  NEXTAUTH_URL: z.preprocess(
    // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    // Since NextAuth.js automatically uses the VERCEL_URL if present.
    (str) => process.env.VERCEL_URL ?? str,
    // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    process.env.VERCEL ? z.string() : z.string().url(),
  ),
  DISCORD_CLIENT_ID: z.string(),
  DISCORD_CLIENT_SECRET: z.string(),
  TEST: z.string().transform((s) => s.length),
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const client = z.object({
  // NEXT_PUBLIC_CLIENTVAR: z.string(),
});

/**
 * You can't destruct `process.env` as a regular object in the Next.js
 * edge runtimes (e.g. middlewares) or client-side so we need to destruct manually.
 */
const processEnv: Record<
  keyof z.infer<typeof server> | keyof z.infer<typeof client>,
  string | undefined
> = {
  DATABASE_URL: process.env.DATABASE_URL,
  TEST: "test",
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,

  // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
};

/**********************************/
/*                                */
/*     DO NOT EDIT BELOW HERE     */
/*                                */
/**********************************/

const merged = server.merge(client);
type Env = z.infer<typeof merged>;

export function getEnv<TKeys extends (keyof Env)[]>(
  keys: TKeys,
): { [K in TKeys[number]]: Env[K] } {
  const isServer = typeof window === "undefined";

  const filteredAll = merged.pick(
    Object.fromEntries(keys.map((key) => [key, true])),
  );
  const filteredClient = client.pick(
    Object.fromEntries(keys.map((key) => [key, true])),
  );

  const parsed = isServer
    ? filteredAll.safeParse(processEnv) // on server we can validate all env vars
    : filteredClient.safeParse(processEnv); // on client we can only validate the ones that are exposed

  if (parsed.success === false) {
    console.error(
      "❌ Invalid environment variables:\n",
      parsed.error.flatten(),
    );
    throw new Error("Invalid environment variables");
  }

  return new Proxy(parsed.data, {
    get(target, prop) {
      if (
        typeof prop !== "string" ||
        (typeof prop === "string" && !(prop in target))
      )
        return undefined;
      // Throw a descriptive error if a server-side env var is accessed on the client
      // Otherwise it would just be returning `undefined` and be annoying to debug
      if (!isServer && !prop.startsWith("NEXT_PUBLIC_"))
        throw new Error(
          `❌ Attempted to access server-side environment variable '${prop}' on the client`,
        );

      return target[prop as keyof typeof target];
    },
  }) as z.infer<typeof merged>;
}
