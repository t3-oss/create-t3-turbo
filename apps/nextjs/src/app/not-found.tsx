import Link from "next/link";

import { Button } from "@gmacko/ui/button";

/**
 * Custom 404 page.
 *
 * Shown when a route doesn't match any known paths.
 * Uses the root layout (no "use client" needed — Server Component).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="text-muted-foreground text-sm font-medium">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="text-muted-foreground mt-4">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild>
            <Link href="/" prefetch>Go home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings" prefetch>Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
