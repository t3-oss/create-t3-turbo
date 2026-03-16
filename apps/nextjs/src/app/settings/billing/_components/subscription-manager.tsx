"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@gmacko/ui/button";

import { useTRPC } from "~/trpc/react";

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    starter: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    pro: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    enterprise:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[plan] ?? colors.free}`}
    >
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    past_due:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    trialing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? colors.active}`}
    >
      {status.replace("_", " ").charAt(0).toUpperCase() +
        status.replace("_", " ").slice(1)}
    </span>
  );
}

export function SubscriptionManager() {
  const trpc = useTRPC();

  const { data: currentSub, isLoading: subLoading } = useQuery(
    trpc.subscription.current.queryOptions(),
  );

  const { data: plans, isLoading: plansLoading } = useQuery(
    trpc.subscription.plans.queryOptions(),
  );

  if (subLoading || plansLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse rounded-lg border p-6">
          <div className="bg-muted h-6 w-48 rounded" />
          <div className="bg-muted mt-4 h-4 w-32 rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse rounded-lg border p-6">
              <div className="bg-muted h-6 w-24 rounded" />
              <div className="bg-muted mt-4 h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Current Plan</h2>
        <div className="flex items-center gap-4">
          <PlanBadge plan={currentSub?.plan ?? "free"} />
          <StatusBadge status={currentSub?.status ?? "active"} />
        </div>
        {currentSub?.currentPeriodEnd && (
          <p className="text-muted-foreground mt-2 text-sm">
            Current period ends:{" "}
            {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}
          </p>
        )}
        {currentSub?.stripeCustomerId && (
          <Button variant="outline" size="sm" className="mt-4">
            Manage Billing
          </Button>
        )}
      </section>

      {/* Available Plans */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Available Plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans?.map((plan) => {
            const isCurrent = currentSub?.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative rounded-lg border p-6 transition-shadow hover:shadow-md ${
                  isCurrent
                    ? "border-primary ring-primary/20 ring-2"
                    : "border-border"
                }`}
              >
                {isCurrent && (
                  <span className="bg-primary text-primary-foreground absolute -top-3 left-4 rounded-full px-2 py-0.5 text-xs font-medium">
                    Current
                  </span>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  {plan.description}
                </p>
                <div className="mt-4">
                  {plan.price !== null ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${plan.price}</span>
                      {plan.interval && (
                        <span className="text-muted-foreground text-sm">
                          /{plan.interval}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-2xl font-bold">Custom</span>
                  )}
                </div>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <svg
                        className="text-primary mt-0.5 h-4 w-4 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  {isCurrent ? (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.price === null ? (
                    <Button variant="outline" size="sm" className="w-full">
                      Contact Sales
                    </Button>
                  ) : (
                    <Button size="sm" className="w-full">
                      {plan.price === 0 ? "Downgrade" : "Upgrade"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
