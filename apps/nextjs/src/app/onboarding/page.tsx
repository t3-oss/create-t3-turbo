import { Suspense } from "react";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import { Skeleton } from "@gmacko/ui/skeleton";

import { getSession } from "~/auth/server";

const OnboardingWizard = dynamic(
  () =>
    import("./_components/onboarding-wizard").then((m) => m.OnboardingWizard),
  {
    loading: () => (
      <div className="space-y-6 rounded-lg border p-8">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    ),
  },
);

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Suspense>
          <OnboardingWizard
            userName={session.user.name}
            userEmail={session.user.email}
          />
        </Suspense>
      </div>
    </div>
  );
}
