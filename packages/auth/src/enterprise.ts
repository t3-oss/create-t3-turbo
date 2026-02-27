/**
 * Enterprise SSO / SAML Configuration
 *
 * This module provides SAML 2.0 SSO configuration for enterprise customers.
 * Better Auth's organization plugin handles the base multi-tenancy, and
 * this module layers on SAML IdP (Identity Provider) support.
 *
 * Supported IdPs:
 * - Okta
 * - Azure AD (Entra ID) — also available via Microsoft OAuth
 * - Google Workspace — also available via Google OAuth
 * - OneLogin
 * - JumpCloud
 * - Generic SAML 2.0
 *
 * Setup Flow:
 * 1. Enterprise customer provides their IdP metadata URL or XML
 * 2. You configure the SSO connection for their organization
 * 3. Their users authenticate through their corporate IdP
 * 4. Better Auth handles assertion parsing and session creation
 *
 * Environment Variables:
 *   SAML_ISSUER        — Your app's SAML entity ID (e.g., "https://yourapp.com")
 *   SAML_CALLBACK_URL  — ACS URL (e.g., "https://yourapp.com/api/auth/saml/callback")
 *   SAML_CERT          — Your SP certificate (PEM format, base64 encoded)
 *   SAML_PRIVATE_KEY   — Your SP private key (PEM format, base64 encoded)
 *
 * Per-Organization IdP Configuration (stored in DB):
 *   - idpMetadataUrl    — The customer's IdP metadata endpoint
 *   - idpEntityId       — The customer's IdP entity ID
 *   - idpSsoUrl         — The customer's SSO login URL
 *   - idpCertificate    — The customer's IdP X.509 certificate
 *   - organizationId    — Maps to the organization table
 */

export interface SamlIdpConfig {
  /** Organization ID this IdP is associated with */
  organizationId: string;
  /** IdP metadata URL (preferred — auto-fetches all config) */
  metadataUrl?: string;
  /** IdP Entity ID */
  entityId: string;
  /** IdP SSO URL (where to redirect for login) */
  ssoUrl: string;
  /** IdP X.509 certificate for signature verification */
  certificate: string;
  /** Optional: IdP SLO (Single Logout) URL */
  sloUrl?: string;
  /** Whether this connection is active */
  enabled: boolean;
}

export interface SamlSpConfig {
  /** Your app's entity ID / issuer */
  entityId: string;
  /** Assertion Consumer Service URL */
  acsUrl: string;
  /** Single Logout URL */
  sloUrl?: string;
  /** Your SP certificate (PEM) */
  certificate?: string;
}

/**
 * Get the Service Provider (SP) configuration for your app.
 * This is what you share with enterprise customers to set up their IdP.
 */
export function getSpConfig(baseUrl: string): SamlSpConfig {
  return {
    entityId: process.env.SAML_ISSUER ?? baseUrl,
    acsUrl: process.env.SAML_CALLBACK_URL ?? `${baseUrl}/api/auth/saml/callback`,
    sloUrl: `${baseUrl}/api/auth/saml/logout`,
  };
}

/**
 * Common IdP presets for quick setup.
 *
 * Usage:
 *   const config = IDP_PRESETS.okta({
 *     orgSlug: "acme",
 *     domain: "acme.okta.com",
 *   });
 */
export const IDP_PRESETS = {
  okta: (opts: { domain: string }) => ({
    metadataUrl: `https://${opts.domain}/app/exk.../sso/saml/metadata`,
    entityId: `http://www.okta.com/exk...`,
    ssoUrl: `https://${opts.domain}/app/.../sso/saml`,
  }),

  azureAd: (opts: { tenantId: string }) => ({
    metadataUrl: `https://login.microsoftonline.com/${opts.tenantId}/federationmetadata/2007-06/federationmetadata.xml`,
    entityId: `https://sts.windows.net/${opts.tenantId}/`,
    ssoUrl: `https://login.microsoftonline.com/${opts.tenantId}/saml2`,
  }),

  googleWorkspace: () => ({
    metadataUrl: "https://accounts.google.com/saml/metadata",
    entityId: "https://accounts.google.com",
    ssoUrl: "https://accounts.google.com/o/saml2/idp",
  }),

  onelogin: (opts: { subdomain: string }) => ({
    metadataUrl: `https://${opts.subdomain}.onelogin.com/saml/metadata/...`,
    entityId: `https://app.onelogin.com/saml/metadata/...`,
    ssoUrl: `https://${opts.subdomain}.onelogin.com/trust/saml2/http-post/sso/...`,
  }),
} as const;

/**
 * Validate an IdP metadata URL by checking it returns valid XML.
 */
export async function validateIdpMetadata(
  metadataUrl: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch(metadataUrl, {
      headers: { Accept: "application/xml, text/xml" },
    });

    if (!response.ok) {
      return {
        valid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const text = await response.text();
    if (
      !text.includes("EntityDescriptor") &&
      !text.includes("IDPSSODescriptor")
    ) {
      return {
        valid: false,
        error: "Response does not appear to be valid SAML metadata",
      };
    }

    return { valid: true };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : "Failed to fetch metadata",
    };
  }
}
