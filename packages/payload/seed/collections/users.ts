import payload from "@acme/payload";

export const seedUsers = async () => {
  try {
    payload.logger.info(`— Seeding test users...`);

    await payload.create<"users">({
      collection: "users",
      data: { email: "em@i.l", password: "pass" },
    });
  } catch (error) {
    payload.logger.info(error, "Failed to seed database");
    process.exit(1);
  }
};
