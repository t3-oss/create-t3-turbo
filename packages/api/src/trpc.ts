import { createHash } from "crypto";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { z, ZodError } from "zod/v4";

import type { Auth } from "@gmacko/auth";
import { and, eq, isNull } from "@gmacko/db";
import { db } from "@gmacko/db/client";
import { apiKeys, user } from "@gmacko/db/schema";
import { createLogger } from "@gmacko/logging";

export type ApiKeyPermission = "read" | "write" | "delete" | "admin";

export interface ApiKeyAuth {
  userId: string;
  permissions: ApiKeyPermission[];
  keyId: string;
}

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

async function validateApiKey(key: string): Promise<ApiKeyAuth | null> {
  const keyHash = hashApiKey(key);

  const [keyRecord] = await db
    .select({
      id: apiKeys.id,
      userId: apiKeys.userId,
      permissions: apiKeys.permissions,
      expiresAt: apiKeys.expiresAt,
    })
    .from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), isNull(apiKeys.revokedAt)))
    .limit(1);

  if (!keyRecord) return null;

  if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
    return null;
  }

  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, keyRecord.id));

  return {
    userId: keyRecord.userId,
    permissions: keyRecord.permissions as ApiKeyPermission[],
    keyId: keyRecord.id,
  };
}

export const createTRPCContext = async (opts: {
  headers: Headers;
  auth: Auth;
}) => {
  const authApi = opts.auth.api;

  const authHeader = opts.headers.get("authorization");
  if (authHeader?.startsWith("Bearer gmk_")) {
    const apiKey = authHeader.slice(7);
    const apiKeyAuth = await validateApiKey(apiKey);

    if (apiKeyAuth) {
      const [userRecord] = await db
        .select()
        .from(user)
        .where(eq(user.id, apiKeyAuth.userId))
        .limit(1);

      if (userRecord) {
        return {
          authApi,
          session: {
            user: userRecord,
            session: null,
          },
          apiKeyAuth,
          db,
        };
      }
    }
  }

  const session = await authApi.getSession({
    headers: opts.headers,
  });

  return {
    authApi,
    session,
    apiKeyAuth: null as ApiKeyAuth | null,
    db,
  };
};
/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError:
        error.cause instanceof ZodError
          ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
          : null,
    },
  }),
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the /src/server/api/routers folder
 */

/**
 * This is how you create new routers and subrouters in your tRPC API
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution and adding an articifial delay in development.
 *
 * You can remove this if you don't like it, but it can help catch unwanted waterfalls by simulating
 * network latency that would occur in production but not in local development.
 */
const trpcLogger = createLogger({ component: "trpc" });

const timingMiddleware = t.middleware(async ({ next, path, ctx }) => {
  const start = Date.now();

  if (t._config.isDev) {
    // artificial delay in dev 100-500ms
    const waitMs = Math.floor(Math.random() * 400) + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  const result = await next();

  const durationMs = Date.now() - start;
  const userId = ctx.session?.user?.id;

  if (durationMs > 3000) {
    trpcLogger.warn({ path, durationMs, userId }, "Slow tRPC procedure");
  } else {
    trpcLogger.info({ path, durationMs, userId }, `${path} completed`);
  }

  return result;
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use this. It verifies
 * the session is valid and guarantees `ctx.session.user` is not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(timingMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
      },
    });
  });

const createApiKeyProcedure = (requiredPermission: ApiKeyPermission) =>
  t.procedure.use(timingMiddleware).use(({ ctx, next }) => {
    if (!ctx.apiKeyAuth) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "API key required",
      });
    }

    const hasPermission =
      ctx.apiKeyAuth.permissions.includes("admin") ||
      ctx.apiKeyAuth.permissions.includes(requiredPermission);

    if (!hasPermission) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `API key lacks '${requiredPermission}' permission`,
      });
    }

    if (!ctx.session?.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    return next({
      ctx: {
        session: { ...ctx.session, user: ctx.session.user },
        apiKeyAuth: ctx.apiKeyAuth,
      },
    });
  });

export const apiKeyReadProcedure = createApiKeyProcedure("read");
export const apiKeyWriteProcedure = createApiKeyProcedure("write");
export const apiKeyDeleteProcedure = createApiKeyProcedure("delete");
export const apiKeyAdminProcedure = createApiKeyProcedure("admin");
