import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { SubscriptionManager } from "./_components/subscription-manager";

export default async function BillingPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Billing & Subscription</h1>
      <p className="text-muted-foreground mb-8">
        Manage your subscription plan and billing information.
      </p>

      <SubscriptionManager />
    </main>
  );
}
