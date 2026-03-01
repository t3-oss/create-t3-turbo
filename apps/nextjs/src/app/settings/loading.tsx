import { Skeleton } from "@gmacko/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-8 w-48" />
      </div>

      {/* Form skeleton */}
      <div className="space-y-4 rounded-lg border p-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="mt-4 h-9 w-24" />
      </div>
    </div>
  );
}
