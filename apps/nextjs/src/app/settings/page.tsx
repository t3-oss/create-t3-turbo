import { Suspense } from "react";
import dynamic from "next/dynamic";

import { PageHeader } from "@gmacko/ui/page-header";
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
      <PageHeader
        title="Settings"
        description="Manage your preferences, notifications, and API keys."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings" },
        ]}
      />

      <div className="space-y-8">
        <PreferencesSection />
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
          <ApiKeysSection />
        </Suspense>
      </div>
    </div>
  );
}
