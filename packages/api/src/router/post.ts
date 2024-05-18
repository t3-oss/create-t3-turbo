import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { Post } from "@acme/db";
import { CreatePost } from "@acme/validators";

import { protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = {
  all: publicProcedure.query(() => Post.find().limit(10)),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => Post.findById(input.id)),

  create: protectedProcedure
    .input(CreatePost)
    .mutation(({ input }) => Post.create(input)),

  delete: protectedProcedure
    .input(z.string())
    .mutation(({ input }) => Post.findByIdAndDelete(input)),
} satisfies TRPCRouterRecord;
