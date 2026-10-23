import { treaty } from "@elysiajs/eden";
import type { App } from "@acme/api";

export const getBaseUrl = () => import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const api = treaty<App>(getBaseUrl(), {
  fetch: { credentials: "include" },
});
