import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.payload.find({
      collection: "posts",
      limit: 10,
    });
    return posts;
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.payload.findByID({
        collection: "posts",
        id: input.id,
      });
      return post;
    }),

  create: publicProcedure
    .input(z.object({ title: z.string(), content: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.payload.create({
        collection: "posts",
        data: input,
      });
    }),

  delete: publicProcedure.input(z.string()).mutation(({ ctx, input }) => {
    return ctx.payload.delete({
      collection: "posts",
      id: input,
    });
  }),
} satisfies TRPCRouterRecord;
