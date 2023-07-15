import type { ComponentProps } from "react";

import { auth, CSRF_experimental } from "@acme/auth";

export function SignIn({
  provider,
  ...props
}: { provider: string } & ComponentProps<"button">) {
  return (
    <form action={`/api/auth/signin/${provider}`} method="post">
      <button {...props} />
      <CSRF_experimental />
    </form>
  );
}

export function SignOut(props: ComponentProps<"button">) {
  return (
    <form action="/api/auth/signout" method="post">
      <button {...props} />
      <CSRF_experimental />
    </form>
  );
}

export async function AuthShowcase() {
  const session = await auth();

  if (!session) {
    return (
      <SignIn
        provider="google"
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
      >
        Sign in with Discord
      </SignIn>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {session && <span>Logged in as {session.user.name}</span>}
      </p>

      <SignOut className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20">
        Sign out
      </SignOut>
    </div>
  );
}
