import { Suspense } from "react";
import dynamic from "next/dynamic";

import { PageHeader } from "@gmacko/ui/page-header";
import { Skeleton } from "@gmacko/ui/skeleton";

import { requireAuth } from "~/lib/guards";

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
  await requireAuth();

  return (
    <div>
      <PageHeader
        title="Billing & Subscription"
        description="Manage your subscription plan and billing information."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings", href: "/settings" },
          { label: "Billing" },
        ]}
      />

      <Suspense fallback={<SubscriptionManagerSkeleton />}>
        <SubscriptionManager />
      </Suspense>
    </div>
  );
}
