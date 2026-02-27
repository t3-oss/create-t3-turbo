import { Suspense } from "react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { Skeleton } from "@gmacko/ui/skeleton";

import { getSession } from "~/auth/server";

const SubscriptionManager = dynamic(
  () =>
    import("./_components/subscription-manager").then(
      (m) => m.SubscriptionManager,
    ),
  {
    loading: () => <SubscriptionManagerSkeleton />,
  },
);

function SubscriptionManagerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
    </div>
  );
}

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

      <Suspense fallback={<SubscriptionManagerSkeleton />}>
        <SubscriptionManager />
      </Suspense>
    </main>
  );
}
