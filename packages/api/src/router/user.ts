import { initContract } from "@ts-rest/core";
import { tsr } from "@ts-rest/serverless/next";
import { z } from "zod";

import { eq } from "@acme/db";
import { db } from "@acme/db/client";
import { User, UserSchema } from "@acme/db/schema";

const c = initContract();

export const userContract = c.router({
  getUser: {
    method: "GET",
    path: `/users/:id`,
    pathParams: z.object({
      id: z.coerce.string(),
    }),
    responses: {
      200: UserSchema.pick({ id: true, name: true }).nullable(),
    },
    summary: "Get a user by username",
  },
});

export const userRouter = tsr.router(userContract, {
  getUser: async ({ params: { id } }) => {
    console.log(id);
    // const user = await db.query.User.findFirst({
    //   where: eq(User.id, id),
    // });

    return {
      status: 201,
      body: { id: "1", name: "test" },
    };
  },
});
