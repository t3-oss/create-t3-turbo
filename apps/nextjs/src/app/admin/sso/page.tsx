import { SsoProvidersManager } from "./_components/sso-providers";

export default function AdminSsoPage() {
  return (
    <div className="p-6">
      <h1 className="mb-2 text-3xl font-bold">SSO Providers</h1>
      <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
        Register your organization&apos;s OIDC identity provider (Okta, Entra
        ID, Google Workspace, Authentik, …). Sign-ins from the matching email
        domain are routed to it automatically — for example, register the domain{" "}
        <code>gmacko.com</code> and anyone entering an <code>@gmacko.com</code>{" "}
        address on the sign-in page is sent to your IdP. The IdP&apos;s origin
        must be allow-listed in the <code>AUTH_SSO_TRUSTED_ISSUERS</code>{" "}
        environment variable before it can be registered.
      </p>
      <SsoProvidersManager />
    </div>
  );
}
