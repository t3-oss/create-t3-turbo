"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@gmacko/ui/button";

import { useTRPC } from "~/trpc/react";

export function AdminDashboard() {
  const trpc = useTRPC();
  const { data: stats, isLoading: statsLoading } = useQuery(
    trpc.admin.stats.queryOptions(),
  );
  const { data: recentUsers, isLoading: usersLoading } = useQuery(
    trpc.admin.listUsers.queryOptions({ limit: 5 }),
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          loading={statsLoading}
        />
        <StatsCard
          title="Admin Users"
          value={stats?.adminUsers ?? 0}
          loading={statsLoading}
        />
        <StatsCard
          title="Regular Users"
          value={stats?.regularUsers ?? 0}
          loading={statsLoading}
        />
      </div>

      {/* Recent Users */}
      <div className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Users</h2>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/users">View All</Link>
          </Button>
        </div>

        {usersLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-muted h-12 rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {recentUsers?.users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="size-8 rounded-full"
                    />
                  ) : (
                    <div className="bg-muted flex size-8 items-center justify-center rounded-full">
                      <span className="text-muted-foreground text-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {user.email}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  loading,
}: {
  title: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg border p-6">
      <p className="text-muted-foreground text-sm font-medium">{title}</p>
      {loading ? (
        <div className="bg-muted mt-2 h-8 w-16 animate-pulse rounded" />
      ) : (
        <p className="mt-2 text-3xl font-bold">{value}</p>
      )}
    </div>
  );
}
