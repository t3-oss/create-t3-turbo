import { Suspense } from "react";
import dynamic from "next/dynamic";

import { Skeleton } from "@gmacko/ui/skeleton";

import { PreferencesSection } from "./_components/preferences";

const ApiKeysSection = dynamic(
  () => import("./_components/api-keys").then((m) => m.ApiKeysSection),
  {
    loading: () => <Skeleton className="h-64 w-full rounded-lg" />,
  },
);

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-2 text-3xl font-bold">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage your preferences, notifications, and API keys.
      </p>

      <div className="space-y-8">
        <PreferencesSection />
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
          <ApiKeysSection />
        </Suspense>
      </div>
    </div>
  );
}
