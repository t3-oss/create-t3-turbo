import { Skeleton } from "@gmacko/ui/skeleton";

/**
 * App-level loading state.
 *
 * Shown during route transitions when a page is fetching data.
 * Uses the same visual rhythm as the main layout.
 */
export default function Loading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Page title skeleton */}
      <Skeleton className="h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />

      {/* Content skeleton */}
      <div className="mt-8 space-y-4">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
