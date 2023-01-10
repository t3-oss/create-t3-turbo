import { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import AppleProvider from "next-auth/providers/apple";
import GithubProvider from "next-auth/providers/github";

import { prisma } from "@acme/db";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

export const authOptions: NextAuthOptions = {
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
    // ...add more providers here
    AppleProvider({
      id: "expo-apple",
      name: "Apple Expo",
      checks: ["state", "pkce"],
      clientId: process.env.APPLE_CLIENT_ID as string,
      clientSecret: process.env.APPLE_CLIENT_SECRET as string,
      token: {
        async request(context) {
          const tokens = await context.client.callback(
            process.env.NEXTAUTH_EXPO_URL,
            context.params,
            context.checks,
          );
          return { tokens };
        },
      },
    }),
    GithubProvider({
      // id: "expo-github",
      name: "GitHub Expo",
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      checks: ["state", "pkce"], // This is because Expo Authentication uses PKCE. It can be disabled though.
      token: {
        async request(context) {
          console.log("context", context);
          // When requesting tokens, if the callbackUrl does not match, it will not work, the Authorization
          // Server won't give out tokens. Apparently this works with GitHub, though it should be an Expo
          // Auth proxy callbackUrl, like https://auth.expo.io/@xuanan2001/expo-app.
          const tokens = await context.client.oauthCallback(
            // "https://auth.expo.io/@juliusmarminge/expo",
            undefined,
            context.params,
            context.checks,
          );
          console.log("tokens", tokens);
          return { tokens };
        },
      },
    }),
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
