import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

// import { invalidateSessionToken } from "@acme/auth";

import { protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  getUser: publicProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
  getUserPermissions: publicProcedure.query(({ ctx }) => {
    return ctx.permissions;
  }),
  signIn: publicProcedure
    .input(z.object({ email: z.string(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { token, user } = await ctx.payload.login({
        collection: "users",
        data: {
          email: String(input.email),
          password: String(input.password),
        },
      });
      if (!user.id || !token) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      return { token, user };
    }),
  getSecretMessage: protectedProcedure.query(() => {
    return "you can see this secret message!";
  }),
  //   signOut: protectedProcedure.mutation(async (opts) => {
  //     if (!opts.ctx.token) {
  //       return { success: false };
  //     }
  //     await invalidateSessionToken(opts.ctx.token);
  //     return { success: true };
  //   }),
} satisfies TRPCRouterRecord;
