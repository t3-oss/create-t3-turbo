import { Suspense } from "react";

import { Skeleton } from "@gmacko/ui/skeleton";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { AdminDashboard } from "./_components/dashboard";

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-6">
        <Skeleton className="mb-4 h-6 w-32" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function AdminPage() {
  await prefetch(trpc.admin.stats.queryOptions());
  await prefetch(trpc.admin.listUsers.queryOptions({ limit: 5 }));

  return (
    <HydrateClient>
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>
        <Suspense fallback={<AdminDashboardSkeleton />}>
          <AdminDashboard />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
