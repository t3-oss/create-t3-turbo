import { createTRPCReact } from "@trpc/react";
import type { AppRouter } from "@acme/api";

export const trpc = createTRPCReact<AppRouter>();
