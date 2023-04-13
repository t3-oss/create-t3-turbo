import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const postRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany({
      include: { author: { select: { name: true, image: true } } },
      orderBy: { id: "desc" },
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => {
      return ctx.prisma.post.findFirst({
        include: { author: { select: { name: true, image: true } } },
        where: { id: input.id },
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

      return ctx.prisma.post.create({
        data: {
          author: {
            connectOrCreate: {
              where: { id: ctx.user.id },
              create: {
                id: ctx.user.id,
                email: ctx.user.email,
                name: getNameFromUser(),
                image: ctx.user.user_metadata.avatar_url as string | undefined,
                user: { connect: { id: ctx.user.id } },
              },
            },
          },
          ...input,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({ where: { id: input } });

      if (post?.authorId !== ctx.user.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the author is allowed to delete the post",
        });
      }

      return ctx.prisma.post.delete({ where: { id: input } });
    }),
});
