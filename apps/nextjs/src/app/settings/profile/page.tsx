import { PageHeader } from "@gmacko/ui/page-header";

import { requireAuth } from "~/lib/guards";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfilePage() {
  const session = await requireAuth();

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Manage your personal information and account settings."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Settings", href: "/settings" },
          { label: "Profile" },
        ]}
      />

      <ProfileForm
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image ?? undefined,
        }}
      />
    </div>
  );
}
