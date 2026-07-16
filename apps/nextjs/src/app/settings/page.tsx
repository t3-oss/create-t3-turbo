import { appRouter, createTRPCContext } from "@gmacko/api";
import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, getSession } from "~/auth/server";
import { ApiKeysSection } from "./_components/api-keys";
import { PairDeviceSection } from "./_components/pair-device";
import { PreferencesSection } from "./_components/preferences";

const COLLABORATION_ROLES = ["member", "admin"] as const;
type BillingPlan = {
  amountInCents: number;
  currency: string;
  description: string | null;
  id: string;
  interval: string;
  isDefault: boolean;
  key: string;
  name: string;
};

type BillingSubscription = {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  currentPeriodStart: Date | null;
  provider: string;
  status: string;
};

type BillingLimit = {
  currentUsage: number;
  key: string;
  period: string;
  value: number | null;
};

type BillingMeter = {
  aggregation: string;
  currentUsage: number;
  key: string;
  latestPeriodEnd: Date | null;
  latestPeriodStart: Date | null;
  name: string;
  unit: string;
};

type BillingOverview = {
  billing: {
    customerPortalAvailable: boolean;
    plan: BillingPlan | null;
    plans: BillingPlan[];
    providerConfigured: boolean;
    subscription: BillingSubscription | null;
    visible: boolean;
  };
  usage: {
    currentPeriodEnd: Date | null;
    currentPeriodStart: Date | null;
    limits: BillingLimit[];
    meters: BillingMeter[];
    visible: boolean;
  };
};

function formatMoney(amountInCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100);
}

function formatDate(value: Date | string | null) {
  if (!value) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const requestHeaders = new Headers(await headers());
  const caller = appRouter.createCaller(
    await createTRPCContext({
      headers: requestHeaders,
      authApi: auth.api,
    }),
  );
  const workspaceContext = await caller.settings.getWorkspaceContext();
  const billingOverview =
    (await caller.settings.getBillingOverview()) as BillingOverview;
  const pendingInvites = workspaceContext.canManageWorkspace
    ? await caller.settings.listInvites()
    : [];
  const showCollaboration =
    workspaceContext.canManageWorkspace && workspaceContext.workspace;
  const collaborationWorkspaceName =
    workspaceContext.workspace?.name ?? "this workspace";

  async function createInviteAction(formData: FormData) {
    "use server";

    const currentSession = await getSession();
    if (!currentSession?.user) {
      redirect("/");
    }

    const email = formData.get("email");
    const role = formData.get("role");

    if (typeof email !== "string" || typeof role !== "string") {
      redirect("/settings?inviteError=input");
    }

    const inviteRole = role as (typeof COLLABORATION_ROLES)[number];

    if (!COLLABORATION_ROLES.includes(inviteRole)) {
      redirect("/settings?inviteError=role");
    }

    const actionHeaders = new Headers(await headers());
    const actionCaller = appRouter.createCaller(
      await createTRPCContext({
        headers: actionHeaders,
        authApi: auth.api,
      }),
    );

    try {
      await actionCaller.settings.createInvite({
        email: email.trim(),
        role: inviteRole,
      });
      redirect("/settings?inviteCreated=1");
    } catch {
      redirect("/settings?inviteError=create");
    }
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Settings</h1>

      <div className="space-y-8">
        <PreferencesSection />
        <PairDeviceSection />
        <ApiKeysSection />
        {billingOverview.billing.visible ? (
          <section className="rounded-lg border p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Billing</h2>
              <p className="text-muted-foreground text-sm">
                Billing stays per-workspace in v1. Seat billing is intentionally
                out of scope for this first pass.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Current plan</h3>
                {billingOverview.billing.plan ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="font-medium">
                      {billingOverview.billing.plan.name}
                    </p>
                    <p className="text-muted-foreground">
                      {formatMoney(
                        billingOverview.billing.plan.amountInCents,
                        billingOverview.billing.plan.currency,
                      )}{" "}
                      / {billingOverview.billing.plan.interval}
                    </p>
                    {billingOverview.billing.plan.description ? (
                      <p className="text-muted-foreground">
                        {billingOverview.billing.plan.description}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2 text-sm">
                    No workspace plan is configured yet.
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Subscription status</h3>
                {billingOverview.billing.subscription ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="capitalize">
                      {billingOverview.billing.subscription.status.replaceAll(
                        "_",
                        " ",
                      )}
                    </p>
                    <p className="text-muted-foreground capitalize">
                      Provider: {billingOverview.billing.subscription.provider}
                    </p>
                    <p className="text-muted-foreground">
                      Current period ends{" "}
                      {formatDate(
                        billingOverview.billing.subscription.currentPeriodEnd,
                      )}
                    </p>
                    {billingOverview.billing.subscription.cancelAtPeriodEnd ? (
                      <p className="text-sm text-amber-600">
                        Cancels at period end.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2 text-sm">
                    No paid subscription is attached yet. The workspace can
                    still run on its default plan.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-lg border p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">Available plans</h3>
                <span className="text-muted-foreground text-sm">
                  {billingOverview.billing.plans.length}
                </span>
              </div>

              {billingOverview.billing.plans.length > 0 ? (
                <ul className="mt-4 space-y-2">
                  {billingOverview.billing.plans.map((plan) => (
                    <li
                      key={plan.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        <p className="text-muted-foreground">
                          {formatMoney(plan.amountInCents, plan.currency)} /{" "}
                          {plan.interval}
                        </p>
                      </div>
                      <span className="text-muted-foreground">
                        {plan.isDefault ? "Default" : "Optional"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-3 text-sm">
                  Add plans in the billing primitives before exposing upgrades
                  to customers.
                </p>
              )}

              <p className="text-muted-foreground mt-4 text-sm">
                {billingOverview.billing.providerConfigured
                  ? billingOverview.billing.customerPortalAvailable
                    ? "Stripe is configured and the customer portal can be layered on next."
                    : "Stripe is configured, but this workspace does not have a customer-portal-ready subscription yet."
                  : "Stripe is not configured yet, so billing stays in a read-only scaffold state."}
              </p>
            </div>
          </section>
        ) : null}
        {billingOverview.usage.visible ? (
          <section className="rounded-lg border p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Usage & Limits</h2>
              <p className="text-muted-foreground text-sm">
                Limits stay tied to the current workspace plan. Meter rollups
                are optional and only appear once the product records usage.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Plan limits</h3>
                {billingOverview.usage.limits.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {billingOverview.usage.limits.map((limit) => (
                      <li
                        key={limit.key}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{limit.key}</p>
                          <p className="text-muted-foreground capitalize">
                            {limit.period.replaceAll("_", " ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p>
                            {limit.currentUsage} /{" "}
                            {limit.value === null ? "Unlimited" : limit.value}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-3 text-sm">
                    No plan limits are configured yet.
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="font-medium">Meters</h3>
                {billingOverview.usage.meters.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm">
                    {billingOverview.usage.meters.map((meter) => (
                      <li
                        key={meter.key}
                        className="rounded-md border px-3 py-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{meter.name}</p>
                          <p>
                            {meter.currentUsage} {meter.unit}
                          </p>
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {meter.key} • {meter.aggregation}
                        </p>
                        <p className="text-muted-foreground mt-1">
                          Period {formatDate(meter.latestPeriodStart)} -{" "}
                          {formatDate(meter.latestPeriodEnd)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-3 text-sm">
                    No usage meters are configured yet.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}
        {showCollaboration ? (
          <section className="rounded-lg border p-6">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Collaboration</h2>
              <p className="text-muted-foreground text-sm">
                Invite teammates into {collaborationWorkspaceName}. v1 keeps
                each account on a single active workspace and limits invites to
                member/admin roles.
              </p>
            </div>

            <form action={createInviteAction} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
                <label className="space-y-2">
                  <span className="text-sm font-medium">Email</span>
                  <Input
                    type="email"
                    name="email"
                    placeholder="teammate@example.com"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium">Role</span>
                  <select
                    name="role"
                    defaultValue="member"
                    className="bg-background h-10 rounded-md border px-3 text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                <div className="flex items-end">
                  <Button type="submit" className="w-full sm:w-auto">
                    Send Invite
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Pending invites</h3>
                <span className="text-muted-foreground text-sm">
                  {pendingInvites.length}
                </span>
              </div>

              {pendingInvites.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No pending invites yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <li
                      key={invite.id}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{invite.email}</p>
                        <p className="text-muted-foreground text-sm capitalize">
                          {invite.role}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
