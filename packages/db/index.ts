import { connect } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";

import * as auth from "./schema/auth";
import * as post from "./schema/post";

export const tables = {
  users: auth.users,
  accounts: auth.accounts,
  sessions: auth.sessions,
  verificationTokens: auth.verificationTokens,
  post: post.post,
};

export { mySqlTable as tableCreator } from "./schema/_table";

export * from "drizzle-orm";

// create the connection
const connection = connect({
  url: process.env.DATABASE_URL,
});

export const db = drizzle(connection, { schema: { ...auth, ...post } });
