import { pgTableCreator } from "drizzle-orm/pg-core";

export const pgTable = pgTableCreator((name: string) => {
  if (process.env.DB_PREFIX) {
    return `${process.env.DB_PREFIX}_${name}`;
  }
  return name;
});