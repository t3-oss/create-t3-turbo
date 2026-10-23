import { treaty } from "@elysiajs/eden";
import { QueryClient } from "@tanstack/react-query";

import type { App } from "@acme/api";

import { authClient } from "./auth";
import { getBaseUrl } from "./base-url";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // ...
    },
  },
});

/**
 * A set of typesafe helpers for consuming your API.
 */
export const api = treaty<App>(getBaseUrl(), {
  fetch: { credentials: "include" },
  async onRequest(_path, options) {
    const cookie = await authClient.getCookie();
    if (!cookie) return;

    const headers = new Headers(options.headers);
    headers.set("Cookie", cookie);
    return { ...options, headers };
  },
});
