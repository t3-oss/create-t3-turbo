import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { eq } from "@gmacko/db";
import {
  apiKeys,
  Post,
  purchase,
  subscription,
  user,
  userPreferences,
} from "@gmacko/db/schema";

import { protectedProcedure } from "../trpc";

export const accountRouter = {
  /**
   * Export all user data as JSON (GDPR / SOC2 compliance).
   * Returns everything associated with the current user.
   */
  exportData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [userData] = await ctx.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    const preferences = await ctx.db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    const subscriptions = await ctx.db
      .select({
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        createdAt: subscription.createdAt,
      })
      .from(subscription)
      .where(eq(subscription.userId, userId));

    const purchases = await ctx.db
      .select({
        amount: purchase.amount,
        currency: purchase.currency,
        status: purchase.status,
        metadata: purchase.metadata,
        createdAt: purchase.createdAt,
      })
      .from(purchase)
      .where(eq(purchase.userId, userId));

    const posts = await ctx.db
      .select({
        id: Post.id,
        title: Post.title,
        content: Post.content,
        createdAt: Post.createdAt,
      })
      .from(Post);

    const keys = await ctx.db
      .select({
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        createdAt: apiKeys.createdAt,
        expiresAt: apiKeys.expiresAt,
        revokedAt: apiKeys.revokedAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, userId));

    return {
      exportedAt: new Date().toISOString(),
      user: userData,
      preferences: preferences[0] ?? null,
      subscriptions,
      purchases,
      posts,
      apiKeys: keys,
    };
  }),

  /**
   * Delete the current user's account and all associated data.
   * Requires the user to confirm by typing their email.
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirmEmail: z.string().email(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify the confirmation email matches
      const [currentUser] = await ctx.db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!currentUser || currentUser.email !== input.confirmEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Email confirmation does not match. Please enter your email exactly.",
        });
      }

      // Delete user — cascade will remove related records
      // (subscription, purchases, preferences, api_keys, sessions, accounts)
      await ctx.db.delete(user).where(eq(user.id, userId));

      return { deleted: true };
    }),
} satisfies TRPCRouterRecord;
