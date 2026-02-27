import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold">Profile</h1>
      <p className="text-muted-foreground mb-8">
        Manage your personal information and account settings.
      </p>

      <ProfileForm
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? undefined,
        }}
      />
    </main>
  );
}
