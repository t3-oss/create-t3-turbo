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
    .query(({ input }) => Post.findById(input.id)),

  create: protectedProcedure
    .input(CreatePostSchema)
    .mutation(({ input }) => Post.create(input)),

  delete: protectedProcedure
    .input(z.string())
    .mutation(({ input }) => Post.findByIdAndDelete(input)),
} satisfies TRPCRouterRecord;
