import type { BasePayload } from "payload";

export const seedAdmins = async (payload: BasePayload) => {
  try {
    payload.logger.info(`— Seeding admin users...`);

    await payload.create<"admins">({
      collection: "admins",
      data: { email: "theo@turbo.t3.gg", password: "pass" },
    });
  } catch (error) {
    payload.logger.info(error, "Failed to seed admins");
    process.exit(1);
  }
};
