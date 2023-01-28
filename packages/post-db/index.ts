import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { postPrisma: PrismaClient };

export const postPrisma =
  globalForPrisma.postPrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production")
  globalForPrisma.postPrisma = postPrisma;
