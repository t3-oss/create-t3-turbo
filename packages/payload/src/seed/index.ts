import { getPayload } from "payload";

import config from "../payload.config";
import { seedUsers } from "./collections/users";

async function run() {
  const payload = await getPayload({ config });

  try {
    const isSeeded =
      (await payload.count({ collection: "users" })).totalDocs > 0;
    if (isSeeded) {
      payload.logger.info(`— Database already seeded, skipping...`);
      process.exit(0);
    }

    payload.logger.info("Seeding database...");

    await seedUsers(payload);

    payload.logger.info("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    payload.logger.info(error, "Failed to seed database");
    process.exit(1);
  }
}

void run();
