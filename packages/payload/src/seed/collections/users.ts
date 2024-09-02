import type { BasePayload } from "payload";

export const seedUsers = async (payload: BasePayload) => {
  try {
    payload.logger.info(`— Seeding test users...`);

    await payload.create<"users">({
      collection: "users",
      data: { email: "theo@turbo.t3.gg", password: "pass" },
    });
  } catch (error) {
    payload.logger.info(error, "Failed to seed database");
    process.exit(1);
  }
};
