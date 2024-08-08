import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.payload.find({
      collection: "posts",
      limit: 10,
    });
    return posts;
  }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.payload.findByID({
        collection: "posts",
        id: input.id,
      });
      return post;
    }),

  create: protectedProcedure
    .input(z.object({ title: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.payload.create({
        collection: "posts",
        data: input,
      });
    }),

  delete: protectedProcedure
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      return await ctx.payload.delete({
        collection: "posts",
        id: input,
      });
    }),
} satisfies TRPCRouterRecord;
