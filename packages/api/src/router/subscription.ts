import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { eq } from "@gmacko/db";
import { subscription } from "@gmacko/db/schema";

import { protectedProcedure } from "../trpc";

export const subscriptionRouter = {
  /** Get the current user's subscription (creates a free plan if none exists) */
  current: protectedProcedure.query(async ({ ctx }) => {
    const existing = await ctx.db.query.subscription.findFirst({
      where: eq(subscription.userId, ctx.session.user.id),
    });

    if (!existing) {
      const [created] = await ctx.db
        .insert(subscription)
        .values({
          userId: ctx.session.user.id,
          plan: "free",
          status: "active",
        })
        .returning();
      return created;
    }

    return existing;
  }),

  /** Get available plans and pricing */
  plans: protectedProcedure.query(() => {
    return [
      {
        id: "free",
        name: "Free",
        description: "For individuals getting started",
        price: 0,
        interval: null,
        features: [
          "Up to 3 projects",
          "Basic analytics",
          "Community support",
          "1GB storage",
        ],
      },
      {
        id: "starter",
        name: "Starter",
        description: "For small teams and growing projects",
        price: 19,
        interval: "month" as const,
        features: [
          "Up to 10 projects",
          "Advanced analytics",
          "Email support",
          "10GB storage",
          "Custom domains",
        ],
      },
      {
        id: "pro",
        name: "Pro",
        description: "For professional teams and businesses",
        price: 49,
        interval: "month" as const,
        features: [
          "Unlimited projects",
          "Priority support",
          "100GB storage",
          "Custom domains",
          "Team management",
          "API access",
          "Webhooks",
        ],
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "For large organizations with custom needs",
        price: null,
        interval: null,
        features: [
          "Everything in Pro",
          "Dedicated support",
          "Unlimited storage",
          "SSO / SAML",
          "Audit logs",
          "SLA guarantee",
          "Custom integrations",
        ],
      },
    ];
  }),

  /** Create a Stripe checkout session for upgrading */
  createCheckout: protectedProcedure
    .input(
      z.object({
        plan: z.enum(["starter", "pro"]),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if Stripe is configured
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.",
        });
      }

      // In a real implementation, this would create a Stripe checkout session
      // For now, return a placeholder that demonstrates the pattern
      return {
        url: `${input.successUrl}?plan=${input.plan}&session=placeholder`,
        sessionId: "cs_placeholder",
      };
    }),

  /** Create a Stripe billing portal session */
  createPortal: protectedProcedure
    .input(z.object({ returnUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const sub = await ctx.db.query.subscription.findFirst({
        where: eq(subscription.userId, ctx.session.user.id),
      });

      if (!sub?.stripeCustomerId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No billing account found. Please subscribe to a plan first.",
        });
      }

      // In a real implementation, this would create a Stripe portal session
      return {
        url: input.returnUrl,
      };
    }),
} satisfies TRPCRouterRecord;
