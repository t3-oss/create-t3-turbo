"use client";

import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";
import { useState } from "react";

import { authClient } from "~/auth/client";

/**
 * Bring-your-own SSO sign-in. The identity provider is resolved from the
 * email's domain against the admin-registered providers (e.g. an
 * `@gmacko.com` address routes to the gmacko Okta/Entra tenant).
 */
export function SsoForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);

    const { error: ssoError } = await authClient.signIn.sso({
      email,
      callbackURL: "/",
    });

    if (ssoError) {
      setError(
        ssoError.message ??
          "No SSO provider is registered for that email domain.",
      );
      setLoading(false);
    }
    // On success better-auth redirects the browser to the identity provider.
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <Input
        type="email"
        placeholder="you@company.com"
        aria-label="Work email for SSO"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" size="lg" variant="outline" disabled={loading}>
        {loading ? "Redirecting…" : "Continue with SSO"}
      </Button>
      {error && <p className="text-destructive text-center text-sm">{error}</p>}
    </form>
  );
}
