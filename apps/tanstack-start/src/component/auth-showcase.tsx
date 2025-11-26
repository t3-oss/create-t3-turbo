import { useNavigate } from "@tanstack/react-router";

import { Button } from "@acme/ui/button";

import { authClient } from "~/auth/client";
import { useTransition } from "react";

export function AuthShowcase() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  const [isPending, startTransition] = useTransition();
  const signIn = () => {
    startTransition(async () => {
      const res = await authClient.signIn.social({
        provider: "discord",
        callbackURL: "/",
      });
      if (!res.data?.url) {
        throw new Error("No URL returned from signInSocial");
      }
      await navigate({ href: res.data.url, replace: true });
    });
  };
  const signOut = () => {
    startTransition(async () => {
      await authClient.signOut();
      await navigate({ href: "/", replace: true });
    });
  };

  if (!session) {
    return (
      <Button size="lg" onClick={signIn} disabled={isPending}>
        Sign in with Discord
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in as {session.user.name}</span>
      </p>

      <Button size="lg" onClick={signOut} disabled={isPending}>
        Sign out
      </Button>
    </div>
  );
}
