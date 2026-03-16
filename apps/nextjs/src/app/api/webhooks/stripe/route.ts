import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

import { eq } from "@gmacko/db";
import { db } from "@gmacko/db/client";
import { subscription } from "@gmacko/db/schema";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

// Map Stripe subscription status to our status
function mapStripeStatus(
  status: Stripe.Subscription.Status,
): string {
  const map: Record<string, string> = {
    active: "active",
    canceled: "canceled",
    incomplete: "incomplete",
    incomplete_expired: "canceled",
    past_due: "past_due",
    paused: "paused",
    trialing: "trialing",
    unpaid: "past_due",
  };
  return map[status] ?? "active";
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
) {
  if (session.mode !== "subscription") return;

  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("[Stripe Webhook] No userId in checkout session metadata");
    return;
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(
    session.subscription as string,
  );

  await db
    .insert(subscription)
    .values({
      userId,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: stripeSubscription.items.data[0]?.price.id ?? null,
      plan: (session.metadata?.plan as string) ?? "starter",
      status: mapStripeStatus(stripeSubscription.status),
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(
        stripeSubscription.current_period_end * 1000,
      ),
    })
    .onConflictDoUpdate({
      target: subscription.userId,
      set: {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: stripeSubscription.items.data[0]?.price.id ?? null,
        plan: (session.metadata?.plan as string) ?? "starter",
        status: mapStripeStatus(stripeSubscription.status),
        currentPeriodStart: new Date(
          stripeSubscription.current_period_start * 1000,
        ),
        currentPeriodEnd: new Date(
          stripeSubscription.current_period_end * 1000,
        ),
      },
    });
}

async function handleSubscriptionUpdated(
  stripeSubscription: Stripe.Subscription,
) {
  await db
    .update(subscription)
    .set({
      status: mapStripeStatus(stripeSubscription.status),
      stripePriceId: stripeSubscription.items.data[0]?.price.id ?? null,
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(
        stripeSubscription.current_period_end * 1000,
      ),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    })
    .where(
      eq(subscription.stripeSubscriptionId, stripeSubscription.id),
    );
}

async function handleSubscriptionDeleted(
  stripeSubscription: Stripe.Subscription,
) {
  await db
    .update(subscription)
    .set({
      status: "canceled",
      cancelAtPeriodEnd: false,
    })
    .where(
      eq(subscription.stripeSubscriptionId, stripeSubscription.id),
    );
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Refresh subscription period dates after successful payment
  const stripeSubscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string,
  );

  await db
    .update(subscription)
    .set({
      status: "active",
      currentPeriodStart: new Date(
        stripeSubscription.current_period_start * 1000,
      ),
      currentPeriodEnd: new Date(
        stripeSubscription.current_period_end * 1000,
      ),
    })
    .where(
      eq(subscription.stripeSubscriptionId, stripeSubscription.id),
    );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  await db
    .update(subscription)
    .set({ status: "past_due" })
    .where(
      eq(
        subscription.stripeSubscriptionId,
        invoice.subscription as string,
      ),
    );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook] Signature verification failed: ${message}`);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
      default:
        // Unhandled event type — log for debugging
        console.log(`[Stripe Webhook] Unhandled event: ${event.type}`);
    }
  } catch (err) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
