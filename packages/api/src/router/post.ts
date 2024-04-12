import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { desc, eq } from "@acme/db";
import { createPostSchema, post } from "@acme/db/schema";

// import { CreatePostSchema } from "@acme/validators";

import { protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(({ ctx }) => {
    // return ctx.db.select().from(schema.post).orderBy(desc(schema.post.id));
    return ctx.db.query.post.findMany({
      orderBy: desc(post.id),
      limit: 10,
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      // return ctx.db
      //   .select()
      //   .from(schema.post)
      //   .where(eq(schema.post.id, input.id));

      return ctx.db.query.post.findFirst({
        where: eq(post.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(({ ctx, input }) => {
      return ctx.db.insert(post).values(input);
    }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return ctx.db.delete(post).where(eq(post.id, input));
  }),
} satisfies TRPCRouterRecord;
