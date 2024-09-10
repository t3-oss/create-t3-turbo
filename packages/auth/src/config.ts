import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import type {
  DefaultSession,
  NextAuthConfig,
  Session as NextAuthSession,
} from "next-auth";
import type { BasePayload } from "payload";
import { skipCSRFCheck } from "@auth/core";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Discord from "next-auth/providers/discord";
import { getPayload as getPayloadInstance } from "payload";

import configPromise from "@acme/payload";

import { env } from "../env";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function getPayload(): ReturnType<typeof getPayloadInstance> {
  const payload = await getPayloadInstance({ config: await configPromise });
  console.log(payload.db.tables.User);
  return payload;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const isSecureContext = env.NODE_ENV !== "development";

function PayloadAdapter(payload: BasePayload) {
  return DrizzleAdapter(payload.db.drizzle, {
    usersTable: payload.db.tables.customers,
    accountsTable: payload.db.tables.accounts,
    sessionsTable: payload.db.tables.sessions,
  });
}

export const authConfig = async () => {
  const payload = await getPayload();
  // let output = "";

  // // output += "Inspecting payload.db.tables:\n";
  // // output += inspectObject(payload.db.tables, 0, 2) + "\n\n";

  // output += inspectObject(payload.db.tables.users, 0, 2) + "\n";

  // const outputPath = path.join(__dirname, "..", "payload-db-inspection.json");
  // await fs.writeFile(outputPath, output, "utf8");
  return {
    debug: true,
    adapter: PayloadAdapter(payload),
    ...(!isSecureContext
      ? {
          skipCSRFCheck: skipCSRFCheck,
          trustHost: true,
        }
      : {}),
    secret: env.AUTH_SECRET,
    providers: [Discord],
    callbacks: {
      session: (opts) => {
        if (!("user" in opts))
          throw new Error("unreachable with session strategy");
        return {
          ...opts.session,
          user: {
            ...opts.session.user,
            id: opts.user.id,
          },
        };
      },
    },
  } satisfies NextAuthConfig;
};

export const validateToken = async (
  token: string,
): Promise<NextAuthSession | null> => {
  const sessionToken = token.slice("Bearer ".length);
  const payload = await getPayload();
  const adapter = PayloadAdapter(payload);
  const session = await adapter.getSessionAndUser?.(sessionToken);
  return session
    ? {
        user: {
          ...session.user,
        },
        expires: session.session.expires.toISOString(),
      }
    : null;
};

export const invalidateSessionToken = async (token: string) => {
  const sessionToken = token.slice("Bearer ".length);
  const payload = await getPayload();
  const adapter = PayloadAdapter(payload);
  await adapter.deleteSession?.(sessionToken);
};

export function inspectObject(obj: unknown, depth = 0, maxDepth = 3): string {
  if (depth > maxDepth) return "(max depth reached)";

  if (typeof obj !== "object" || obj === null) {
    return JSON.stringify(obj);
  }

  const seen = new WeakSet();

  function inspect(value: unknown, currentDepth: number): string {
    if (typeof value !== "object" || value === null) {
      return JSON.stringify(value);
    }

    if (seen.has(value)) {
      return "(circular reference)";
    }

    seen.add(value);

    if (Array.isArray(value)) {
      const items = value.map((item) => inspect(item, currentDepth + 1));
      return `[${items.join(", ")}]`;
    }

    const entries = Object.entries(value).map(([key, val]) => {
      return `${JSON.stringify(key)}: ${inspect(val, currentDepth + 1)}`;
    });

    return `{\n${"  ".repeat(currentDepth + 1)}${entries.join(",\n" + "  ".repeat(currentDepth + 1))}\n${"  ".repeat(currentDepth)}}`;
  }

  return inspect(obj, depth);
}
