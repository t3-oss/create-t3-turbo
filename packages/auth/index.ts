import { randomUUID } from "crypto";
import Discord from "@auth/core/providers/discord";
import type { DefaultSession } from "@auth/core/types";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import NextAuth from "next-auth";
import type { Session, SessionStrategy, TokenSet } from "next-auth/core/types";
import CredentialsProvider from "next-auth/providers/credentials";
import isEmail from "validator/lib/isEmail";

import { prisma } from "@acme/db";

import { env } from "./env.mjs";

export type { Session } from "next-auth";

export const providers = ["email", "discord"] as const;
export type OAuthProviders = (typeof providers)[number];

const client = PrismaAdapter(prisma);

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

const maxAge = 30 * 24 * 60 * 60; // 30 days

const authorize = async (credentials) => {
  const { email, password } = credentials;
  let user;

  try {
    if (!isEmail(email)) {
      throw new Error("Email should be a valid email address");
    }
    user = await client.getUserByEmail(email);
    if (!user) {
      user = await client.createUser({
        email,
        password: bcrypt.hashSync(password, 10),
      });
    } else {
      const passwordsMatch = await bcrypt.compare(password, user.password);
      if (!passwordsMatch) {
        throw new Error("Password is not correct");
      }
    }
    const token = randomUUID();
    await client.createSession({
      userId: user.id,
      expires: new Date(Date.now() + maxAge * 1000),
      sessionToken: token,
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      sessionToken: token,
    };
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

const EmailCredentials = CredentialsProvider({
  name: "email",
  credentials: {
    email: { label: "Email", type: "text" },
    password: { label: "Password", type: "password" },
  },
  authorize,
});

export const authOptions = {
  secret: env.NEXTAUTH_SECRET,
  adapter: client,
  providers: [
    EmailCredentials,
    Discord({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
    maxAge: maxAge, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.sessionToken = user.sessionToken;
      }
      if (token?.sessionToken) {
        const { session } = await client.getSessionAndUser(token.sessionToken);
        if (!session) {
          return null;
        }
      }
      return token;
    },
    session: ({ session, user }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),

    // @TODO - if you wanna have auth on the edge
    // jwt: ({ token, profile }) => {
    //   if (profile?.id) {
    //     token.id = profile.id;
    //     token.image = profile.picture;
    //   }
    //   return token;
    // },

    // @TODO
    // authorized({ request, auth }) {
    //   return !!auth?.user
    // }
  },
  events: {
    signOut: async ({ token, session }) => {
      if (token?.sessionToken) {
        await client.deleteSession(token.sessionToken);
      }
    },
  },
};

export const {
  handlers: { GET, POST },
  auth,
  CSRF_experimental,
} = NextAuth(authOptions);
