import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";

import { desc, eq, schema } from "@acme/db";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.post.findMany({
      with: { author: true },
      orderBy: desc(schema.post.id),
      limit: 10,
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.post.findFirst({
        with: { author: true },
        where: eq(schema.post.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      function getNameFromUser() {
        const meta = ctx.user.user_metadata;
        if (typeof meta.name === "string") return meta.name;
        if (typeof meta.full_name === "string") return meta.full_name;
        if (typeof meta.user_name === "string") return meta.user_name;
        return "[redacted]";
      }

      const authorId = await ctx.db.query.profile
        .findFirst({
          where: eq(schema.profile.id, ctx.user.id),
        })
        .then(async (profile) => {
          if (profile) return profile.id;
          const [newProfile] = await ctx.db
            .insert(schema.profile)
            .values({
              id: ctx.user.id,
              name: getNameFromUser(),
              image: ctx.user.user_metadata.avatar_url as string | undefined,
              email: ctx.user.email,
            })
            .returning();

          return newProfile!.id;
        });

      return ctx.db.insert(schema.post).values({
        id: nanoid(),
        authorId,
        title: input.title,
        content: input.content,
      });
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.query.post.findFirst({
        where: eq(schema.post.id, input),
      });

      if (post?.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the author is allowed to delete the post",
        });
      }

      return ctx.db.delete(schema.post).where(eq(schema.post.id, input));
    }),
});
