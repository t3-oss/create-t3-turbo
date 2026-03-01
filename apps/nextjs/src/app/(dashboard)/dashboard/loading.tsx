import { Skeleton } from "@gmacko/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-8 w-64" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-lg border p-6">
            <Skeleton className="mb-2 h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="rounded-lg border p-6">
          <Skeleton className="mb-4 h-6 w-32" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
