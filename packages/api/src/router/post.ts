import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { Post } from "@acme/db";
import { CreatePostSchema } from "@acme/validators";

import { protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(async () => {
    const posts = await Post.find().limit(10);

    return posts.map((post) => ({
      id: post._id.toString(),
      title: post.title,
      content: post.content,
    }));
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const post = await Post.findById(input.id);

      if (!post) return null;

      return {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
      };
    }),

  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(async ({ input }) => {
      await Post.create(input);
    }),

  delete: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await Post.findByIdAndDelete(input);
  }),
} satisfies TRPCRouterRecord;
