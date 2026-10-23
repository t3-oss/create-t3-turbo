import { createAuthClient } from "better-auth/client";

import { getBaseUrl } from "./api";

export const authClient = createAuthClient({ baseURL: getBaseUrl() });
