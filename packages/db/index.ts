import { PrismaClient } from "./.generated/client";

export const prisma = new PrismaClient({
  log: ["query"],
});
