import { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GithubProvider from "next-auth/providers/github";

import { prisma } from "@acme/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
    {
      ...GithubProvider({
        name: "Github Expo Proxy",
        clientId: process.env.GITHUB_ID as string,
        clientSecret: process.env.GITHUB_SECRET as string,
        checks: ["state"],
        token: {
          async request(context) {
            const tokens = await context.client.oauthCallback(
              undefined,
              context.params,
              context.checks,
            );
            return { tokens };
          },
        },
      }),
      id: "github-expo",
    },
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
    {
      ...DiscordProvider({
        name: "Discord Expo",
        checks: ["state"],
        clientId: process.env.DISCORD_CLIENT_ID as string,
        clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
        token: {
          async request(context) {
            const tokens = await context.client.oauthCallback(
              process.env.NEXTAUTH_EXPO_URL,
              context.params,
              context.checks,
            );
            return { tokens };
          },
        },
      }),
      id: "discord-expo",
    },
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};
