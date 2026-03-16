import { Suspense } from "react";

import { PageHeader } from "@gmacko/ui/page-header";
import { ListSkeleton } from "@gmacko/ui/skeleton";

import { SessionList } from "./_components/session-list";

export default function SessionsPage() {
  return (
    <div>
      <PageHeader
        title="Active Sessions"
        description="Manage your active sessions across devices. Revoke any session you don't recognize."
      />
      <Suspense fallback={<ListSkeleton count={3} />}>
        <SessionList />
      </Suspense>
    </div>
  );
}
