import { Elysia } from "elysia";

import type { Auth } from "@acme/auth";

export const authed = (auth: Auth) =>
  new Elysia({ name: "auth" }).macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401);
        return { user: session.user, session: session.session };
      },
    },
  });
