import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { userPrisma: PrismaClient };

export const userPrisma =
  globalForPrisma.userPrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production")
  globalForPrisma.userPrisma = userPrisma;
