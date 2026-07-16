import { appRouter, createTRPCContext } from "@gmacko/api";
import { Button } from "@gmacko/ui/button";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth, getSession } from "~/auth/server";
import { env } from "~/env";
import { MagicLinkForm } from "./magic-link-form";
import { SsoForm } from "./sso-form";

export async function AuthShowcase() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="flex flex-col items-center gap-4">
        <SocialSignInButton provider="github" label="Sign in with GitHub" />
        <SocialSignInButton provider="google" label="Sign in with Google" />
        <SocialSignInButton provider="apple" label="Sign in with Apple" />

        <div className="flex w-full items-center gap-3 py-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-muted-foreground text-sm">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <MagicLinkForm bypassMagicLink={env.BYPASS_MAGIC_LINK} />

        <div className="flex w-full items-center gap-3 py-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-muted-foreground text-sm">
            or use your organization
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <SsoForm />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name}</span>
      </p>

      <form>
        <Button
          size="lg"
          formAction={async () => {
            "use server";
            await auth.api.signOut({
              headers: await headers(),
            });
            redirect("/");
          }}
        >
          Sign out
        </Button>
      </form>
    </div>
  );
}

function SocialSignInButton({
  provider,
  label,
}: {
  provider: "github" | "google" | "apple";
  label: string;
}) {
  return (
    <form className="w-full">
      <Button
        className="w-full"
        size="lg"
        variant="outline"
        formAction={async () => {
          "use server";
          const requestHeaders = new Headers(await headers());
          const caller = appRouter.createCaller(
            await createTRPCContext({
              headers: requestHeaders,
              authApi: auth.api,
            }),
          );
          const settingsCaller = caller.settings as {
            getLaunchState: () => Promise<{
              maintenanceMode: boolean;
              signupEnabled: boolean;
              canAutoCreateAccounts: boolean;
            }>;
          };
          const launchState = await settingsCaller.getLaunchState();

          if (launchState.maintenanceMode) {
            redirect("/?maintenance=1");
          }

          if (
            !launchState.signupEnabled &&
            !launchState.canAutoCreateAccounts
          ) {
            redirect("/?waitlist=1");
          }

          const res = await auth.api.signInSocial({
            body: {
              provider,
              callbackURL: "/",
            },
          });
          if (!res.url) {
            throw new Error("No URL returned from signInSocial");
          }
          redirect(res.url);
        }}
      >
        {label}
      </Button>
    </form>
  );
}
