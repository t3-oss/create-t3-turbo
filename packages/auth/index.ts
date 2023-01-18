export { authOptions } from "./src/auth-options";
export { getServerSession } from "./src/get-session";
export type { Session } from "next-auth";

import { DefaultSession } from "next-auth";
/**
 * Module augmentation for `next-auth` types
 * Allows us to add custom properties to the `session` object
 * and keep type safety
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
