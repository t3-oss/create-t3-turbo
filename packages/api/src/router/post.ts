import { t } from "../trpc";
import { z } from "zod";

export const postRouter = t.router({
  all: t.procedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany();
  }),
  byId: t.procedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.post.findFirst({ where: { id: input } });
  }),
});
