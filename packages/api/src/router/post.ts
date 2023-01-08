import { createTRPCRouter, publicProcedure } from "../trpc";
import { z } from "zod";

export const postRouter = createTRPCRouter({
  all: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany();
  }),
  byId: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.post.findFirst({ where: { id: input } });
  }),
  create: publicProcedure
    .input(z.object({ title: z.string(), content: z.string() }))
    .mutation(({ ctx, input }) => {
      return ctx.prisma.post.create({ data: input });
    }),
});
