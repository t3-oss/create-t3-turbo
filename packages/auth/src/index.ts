import type { Session } from "next-auth";
import NextAuth from "next-auth";

import { authConfig } from "./config";

export type { Session } from "next-auth";

const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(authConfig);

export { GET, POST, auth, signIn, signOut };

export const validateToken = async (token: string): Promise<Session | null> => {
  const sessionToken = token.slice("Bearer ".length);
  const session = await authConfig.adapter.getSessionAndUser?.(sessionToken);
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
  await authConfig.adapter.deleteSession?.(token);
};
