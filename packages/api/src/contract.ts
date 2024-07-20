import { initContract } from "@ts-rest/core";

import { userContract } from "./router/user";

const c = initContract();

export const contract = c.router({ ...userContract });
