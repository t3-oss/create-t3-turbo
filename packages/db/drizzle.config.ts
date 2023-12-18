import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: "../../.env" });

const uri = [
  "mysql://",
  process.env.DB_USERNAME,
  ":",
  process.env.DB_PASSWORD,
  "@",
  process.env.DB_HOST,
  ":3306/",
  process.env.DB_NAME,
  '?ssl={"rejectUnauthorized":true}',
].join("");

export default {
  schema: "./src/schema",
  driver: "mysql2",
  dbCredentials: { uri },
  tablesFilter: ["t3turbo_*"],
} satisfies Config;
