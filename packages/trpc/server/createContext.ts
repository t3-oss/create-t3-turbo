/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1)
 * 2. You want to create a new middleware or type of procedure (see Part 3)
 *
 * tl;dr - this is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end
 */

import { type GetServerSidePropsContext } from "next";
import { initTRPC, TRPCError, type Maybe } from "@trpc/server";
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { type Session } from "next-auth";
import { type serverSideTranslations } from "next-i18next/serverSideTranslations";
import superjson from "superjson";

import { prisma } from "@acme/db";

import i18nNextConfig from "../../../apps/nextjs/next-i18next.config.mjs";
import { getLocaleFromHeaders } from "../../lib/i18n";

type CreateContextOptions =
  | CreateNextContextOptions
  | GetServerSidePropsContext;

type CreateInnerContextOptions = {
  i18n: Awaited<ReturnType<typeof serverSideTranslations>> | null;
  locale: string;
  session: Session | null;
};

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API
 *
 * These allow you to access things like the database, the session, etc, when
 * processing a request
 *
 */

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here
 *
 * Examples of things you may need it for:
 * - testing, so we dont have to mock Next.js' req/res
 * - trpc's `createSSGHelpers` where we don't have req/res
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
const createInnerTRPCContext = (opts: CreateInnerContextOptions) => {
  return {
    ...opts,
    prisma,
  };
};

/**
 * This is the actual context you'll use in your router. It will be used to
 * process every request that goes through your tRPC endpoint
 * @link https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateContextOptions) => {
  const { getServerSession } = await import("@acme/auth");

  const { req, res } = opts;

  // Get the session from the server using the getServerSession wrapper function
  const session = await getServerSession({ req, res });
  const locale = getLocaleFromHeaders(req);

  return createInnerTRPCContext({
    i18n: null,
    locale,
    session,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the trpc api is initialized, connecting the context and
 * transformer
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
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
export const mergeRouters = t.mergeRouters;
/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure
 */
const perfMiddleware = t.middleware(async ({ path, type, next }) => {
  performance.mark("Start");
  const result = await next();
  performance.mark("End");
  performance.measure(
    `[${result.ok ? "OK" : "ERROR"}][$1] ${type} '${path}'`,
    "Start",
    "End",
  );
  return result;
});

/**
 * Public (unauthed) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in
 */
export const publicProcedure = t.procedure.use(perfMiddleware);

async function getUserFromSession({ session }: { session: Maybe<Session> }) {
  if (!session?.user?.id) {
    return null;
  }
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // some hacks to make sure `username` and `email` are never inferred as `null`
  if (!user) {
    return null;
  }
  const { email } = user;
  if (!email) {
    return null;
  }

  return {
    ...user,

    email,
  };
}

export type UserFromSession = Awaited<ReturnType<typeof getUserFromSession>>;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const user = await getUserFromSession({ session: ctx.session });

  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: user as NonNullable<typeof user> },
    },
  });
});

export const sessionMiddleware = t.middleware(async ({ ctx, next }) => {
  const user = await getUserFromSession(ctx);

  return next({
    ctx:
      // infers the `session` as non-nullable
      { session: { user: user as NonNullable<typeof user> } },
  });
});

export const localeMiddleware = sessionMiddleware.unstable_pipe(
  async ({ ctx, next }) => {
    const { serverSideTranslations } = await import(
      "next-i18next/serverSideTranslations"
    );
    const { user } = ctx.session;

    const i18n = await serverSideTranslations(
      ctx.locale,
      ["common"],
      i18nNextConfig,
      ["en", "cn"],
    );

    const locale = ctx.locale;

    return next({
      ctx: { locale, i18n, user: { ...user, locale } },
    });
  },
);

/**
 * Protected (authed) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees ctx.session.user is not
 * null
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure
  .use(perfMiddleware)
  .use(enforceUserIsAuthed);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithLocale<T extends CreateNextContextOptions = any> = T &
  Required<Pick<CreateInnerContextOptions, "i18n" | "locale">>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithSession<T extends CreateNextContextOptions = any> = T &
  Required<Pick<CreateInnerContextOptions, "session">>;
