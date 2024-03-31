import { createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "./root";

const api = createTRPCReact<AppRouter>();

export { api };
