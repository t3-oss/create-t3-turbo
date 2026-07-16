"use client";

import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";
import { Label } from "@gmacko/ui/label";
import { useCallback, useEffect, useState } from "react";

import { authClient } from "~/auth/client";

interface SsoProviderRow {
  providerId: string;
  issuer: string;
  domain: string;
  oidcConfig?: { clientIdLastFour: string } | undefined;
}

const EMPTY_FORM = {
  providerId: "",
  domain: "",
  issuer: "",
  clientId: "",
  clientSecret: "",
};

/**
 * Admin-only management of bring-your-own OIDC providers. Registration is
 * enforced server-side too: the sso plugin's providersLimit is 0 for
 * non-admin users. The issuer must publish
 * `/.well-known/openid-configuration` — endpoints are discovered from it.
 */
export function SsoProvidersManager() {
  const [providers, setProviders] = useState<SsoProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = useCallback(async () => {
    const { data, error: listError } = await authClient.sso.providers();
    if (listError) {
      setLoadError(listError.message ?? "Could not load SSO providers.");
    } else {
      setLoadError(null);
      setProviders((data?.providers as SsoProviderRow[] | undefined) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProviders();
  }, [loadProviders]);

  const setField = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const canSubmit = Object.values(form).every((v) => v.trim().length > 0);

  const register = async () => {
    setSubmitting(true);
    setError(null);
    const { error: registerError } = await authClient.sso.register({
      providerId: form.providerId.trim(),
      domain: form.domain.trim().toLowerCase(),
      issuer: form.issuer.trim().replace(/\/$/, ""),
      oidcConfig: {
        clientId: form.clientId.trim(),
        clientSecret: form.clientSecret.trim(),
      },
    });
    setSubmitting(false);

    if (registerError) {
      setError(registerError.message ?? "Could not register the provider.");
      return;
    }
    setForm(EMPTY_FORM);
    setShowForm(false);
    await loadProviders();
  };

  const remove = async (providerId: string) => {
    if (!confirm(`Delete SSO provider "${providerId}"?`)) return;
    setRemovingId(providerId);
    setError(null);
    const { error: deleteError } = await authClient.sso.deleteProvider({
      providerId,
    });
    setRemovingId(null);
    if (deleteError) {
      setError(deleteError.message ?? "Could not delete the provider.");
      return;
    }
    await loadProviders();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Registered providers</h2>
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              Add Provider
            </Button>
          )}
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border p-4">
            <h3 className="mb-4 font-medium">Register an OIDC provider</h3>
            {error && <p className="text-destructive mb-4 text-sm">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sso-provider-id" className="mb-2 block">
                  Provider ID
                </Label>
                <Input
                  id="sso-provider-id"
                  value={form.providerId}
                  onChange={(e) => setField("providerId")(e.target.value)}
                  placeholder="gmacko-okta"
                />
              </div>
              <div>
                <Label htmlFor="sso-domain" className="mb-2 block">
                  Email domain
                </Label>
                <Input
                  id="sso-domain"
                  value={form.domain}
                  onChange={(e) => setField("domain")(e.target.value)}
                  placeholder="gmacko.com"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="sso-issuer" className="mb-2 block">
                  Issuer URL
                </Label>
                <Input
                  id="sso-issuer"
                  value={form.issuer}
                  onChange={(e) => setField("issuer")(e.target.value)}
                  placeholder="https://gmacko.okta.com"
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Must serve /.well-known/openid-configuration — endpoints are
                  discovered automatically.
                </p>
              </div>
              <div>
                <Label htmlFor="sso-client-id" className="mb-2 block">
                  Client ID
                </Label>
                <Input
                  id="sso-client-id"
                  value={form.clientId}
                  onChange={(e) => setField("clientId")(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="sso-client-secret" className="mb-2 block">
                  Client secret
                </Label>
                <Input
                  id="sso-client-secret"
                  type="password"
                  value={form.clientSecret}
                  onChange={(e) => setField("clientSecret")(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                onClick={() => void register()}
                disabled={!canSubmit || submitting}
              >
                {submitting ? "Registering…" : "Register"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setForm(EMPTY_FORM);
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!showForm && error && (
          <p className="text-destructive mb-4 text-sm">{error}</p>
        )}

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="bg-muted h-16 rounded" />
          </div>
        ) : loadError ? (
          <p className="text-destructive text-sm">{loadError}</p>
        ) : providers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No SSO providers registered yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {providers.map((provider) => (
              <li
                key={provider.providerId}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{provider.providerId}</p>
                  <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-4 text-sm">
                    <span>@{provider.domain}</span>
                    <span className="font-mono text-xs">{provider.issuer}</span>
                    {provider.oidcConfig && (
                      <span className="font-mono text-xs">
                        client …{provider.oidcConfig.clientIdLastFour}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => void remove(provider.providerId)}
                  disabled={removingId !== null}
                >
                  {removingId === provider.providerId ? "Deleting…" : "Delete"}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
