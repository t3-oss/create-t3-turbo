import { initContract } from "@ts-rest/core";
import { tsr } from "@ts-rest/serverless/next";
import { z } from "zod";

import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { User, UserSchema } from "@acme/db/schema";

const c = initContract();

export const userContract = c.router(
  {
    getUserById: {
      method: "GET",
      path: "/users/:id",
      pathParams: z.object({
        id: z.coerce.string(),
      }),
      responses: {
        200: UserSchema.nullable(),
      },
    },
  },
  {
    pathPrefix: "/api",
  },
);
export const userRouter = tsr.router(userContract, {
  getUserById: async ({ params }) => {
    // const user = await db.query.Post.findFirst({
    //   where: eq(User.id, params.id),
    // });
    return {
      status: 200,
      body: { id: "1" },
    };
  },
});
