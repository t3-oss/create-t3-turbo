import { getPayload } from "payload";

import config from "../payload.config";
import { seedAdmins } from "./collections/admins";

async function run() {
  const payload = await getPayload({ config });

  try {
    const isSeeded =
      (await payload.count({ collection: "admins" })).totalDocs > 0;
    if (isSeeded) {
      payload.logger.info(`— Database already seeded, skipping...`);
      process.exit(0);
    }

    payload.logger.info("Seeding database...");

    await seedAdmins(payload);

    payload.logger.info("Database seeded successfully");
    process.exit(0);
  } catch (error) {
    payload.logger.info(error, "Failed to seed database");
    process.exit(1);
  }
}

void run();
