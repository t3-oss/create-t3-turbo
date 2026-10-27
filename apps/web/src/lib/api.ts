import { treaty } from "@elysiajs/eden";
import type { App } from "@acme/api";
import { ENV } from "varlock/env";

export const getBaseUrl = () => ENV.VITE_API_URL;

export const api = treaty<App>(getBaseUrl(), {
  fetch: { credentials: "include" },
});
