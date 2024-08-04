import type {
  DefaultSession,
  NextAuthConfig,
  Session as NextAuthSession,
} from "next-auth";
import { skipCSRFCheck } from "@auth/core";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// import { DrizzleAdapter } from "@auth/drizzle-adapter";
// import Discord from "next-auth/providers/discord";

// import { db } from "@acme/db/client";
// import { Account, Session, User } from "@acme/db/schema";

import payload from "@acme/payload";

import { env } from "../env";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
// const adapter = DrizzleAdapter(db, {
//   usersTable: User,
//   accountsTable: Account,
//   sessionsTable: Session,
// });

export const isSecureContext = env.NODE_ENV !== "development";

export const authConfig = {
  // adapter,
  // In development, we need to skip checks to allow Expo to work
  // ...(!isSecureContext
  //   ? {
  //       skipCSRFCheck: skipCSRFCheck,
  //       trustHost: true,
  //     }
  //   : {}),
  secret: env.AUTH_SECRET,
  providers: [
    //Discord
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async ({ email, password }) => {
        const { token, user } = await payload.login({
          collection: "users",
          data: {
            email: String(email),
            password: String(password),
          },
        });

        if (!user.id) {
          throw new CredentialsSignin("Invalid credentials");
        }

        // NextAuth expects `id` to be a string
        return { ...user, id: String(user.id) };
      },
    }),
  ],
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

export const validateToken = async (
  req: Request,
): Promise<NextAuthSession | null> => {
  const { user } = await payload.auth({ headers: req.headers });

  return user
    ? {
        user: {
          ...user,
          id: String(user.id), // NextAuth expects `id` to be a string
        },
        // mock session expiration
        expires: new Date("2030-01-01").toISOString(),
      }
    : null;
};

// export const invalidateSessionToken = async (token: string) => {
//   await adapter.deleteSession?.(token);
// };
