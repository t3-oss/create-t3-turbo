import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";

import { OnboardingWizard } from "./_components/onboarding-wizard";

export default async function OnboardingPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <OnboardingWizard
          userName={session.user.name}
          userEmail={session.user.email}
        />
      </div>
    </div>
  );
}
