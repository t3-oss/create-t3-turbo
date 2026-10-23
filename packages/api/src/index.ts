import { cors } from "@elysiajs/cors";
import { Elysia } from "elysia";

import type { Auth } from "@acme/auth";
import type { Orm } from "@acme/db";

import { authed } from "./middleware";
import { postRoutes } from "./router/post";

export function createApp(options: { auth: Auth; orm: Orm }) {
  const { auth, orm } = options;
  return new Elysia()
    .use(
      cors({
        origin: ["http://localhost:3001"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
      }),
    )
    .mount(auth.handler)
    .use(authed(auth))
    .get(
      "/api/protected",
      () => ({ message: "you can see this secret message!" }),
      { auth: true },
    )
    .use(postRoutes(auth, orm));
}
export type App = ReturnType<typeof createApp>;
