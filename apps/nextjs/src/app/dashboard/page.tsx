import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type { ActiveOrganization } from "@acme/auth";

import type { Session } from "~/auth/client";
import { auth } from "~/auth/server";
import AccountSwitcher from "~/components/account-switch";
import { OrganizationCard } from "./organization-card";
import UserCard from "./user-card";

export default async function DashboardPage() {
  const [
    session,
    activeSessions,
    deviceSessions,
    organization,
    // subscriptions
  ] = await Promise.all([
    auth.api.getSession({
      headers: await headers(),
    }),
    auth.api.listSessions({
      headers: await headers(),
    }),
    auth.api.listDeviceSessions({
      headers: await headers(),
    }),
    auth.api.getFullOrganization({
      headers: await headers(),
    }),
    // auth.api.listActiveSubscriptions({
    //   headers: await headers(),
    // }),
  ]).catch((e) => {
    console.log(e);
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    throw redirect("/sign-in");
  });
  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <AccountSwitcher
          sessions={JSON.parse(JSON.stringify(deviceSessions)) as Session[]}
        />
        <UserCard
          session={JSON.parse(JSON.stringify(session)) as Session}
          activeSessions={
            JSON.parse(JSON.stringify(activeSessions)) as Session["session"][]
          }
          // subscription={subscriptions.find(
          //   (sub) => sub.status === "active" || sub.status === "trialing",
          // )}
        />
        <OrganizationCard
          session={JSON.parse(JSON.stringify(session)) as Session}
          activeOrganization={
            JSON.parse(JSON.stringify(organization)) as ActiveOrganization
          }
        />
      </div>
    </div>
  );
}
