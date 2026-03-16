import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq } from "@gmacko/db";
import { notification } from "@gmacko/db/schema";

import { protectedProcedure } from "../trpc";

export const notificationRouter = {
  /** List recent notifications for the current user */
  list: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(50).default(20),
          unreadOnly: z.boolean().default(false),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const conditions = [eq(notification.userId, ctx.session.user.id)];

      if (input?.unreadOnly) {
        conditions.push(eq(notification.read, false));
      }

      const notifications = await ctx.db
        .select()
        .from(notification)
        .where(and(...conditions))
        .orderBy(desc(notification.createdAt))
        .limit(limit);

      return notifications;
    }),

  /** Count of unread notifications (lightweight poll endpoint) */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select()
      .from(notification)
      .where(
        and(
          eq(notification.userId, ctx.session.user.id),
          eq(notification.read, false),
        ),
      );

    // Count via length since Drizzle doesn't have a clean count helper
    const rows = await ctx.db
      .select({ id: notification.id })
      .from(notification)
      .where(
        and(
          eq(notification.userId, ctx.session.user.id),
          eq(notification.read, false),
        ),
      );

    void result; // unused — we're counting rows instead
    return { count: rows.length };
  }),

  /** Mark a single notification as read */
  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(notification)
        .set({ read: true })
        .where(
          and(
            eq(notification.id, input.id),
            eq(notification.userId, ctx.session.user.id),
          ),
        );

      return { success: true };
    }),

  /** Mark all notifications as read for the current user */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(notification)
      .set({ read: true })
      .where(
        and(
          eq(notification.userId, ctx.session.user.id),
          eq(notification.read, false),
        ),
      );

    return { success: true };
  }),
} satisfies TRPCRouterRecord;
