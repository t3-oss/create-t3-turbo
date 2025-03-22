import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "./auth";

export const getSession = async () =>
  cache(auth.api.getSession)({
    headers: await headers(),
  });

export * from "./auth";
