import { Suspense } from "react";

import { PageHeader } from "@gmacko/ui/page-header";
import { Skeleton } from "@gmacko/ui/skeleton";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { UsersList } from "./_components/users-list";

function UsersListSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default async function AdminUsersPage() {
  await prefetch(trpc.admin.listUsers.queryOptions({ limit: 20 }));

  return (
    <HydrateClient>
      <div className="p-6">
        <PageHeader
          title="User Management"
          description="View and manage all users in your application."
          breadcrumbs={[
            { label: "Admin", href: "/admin" },
            { label: "Users" },
          ]}
        />
        <Suspense fallback={<UsersListSkeleton />}>
          <UsersList />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
