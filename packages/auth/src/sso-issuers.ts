/**
 * Parse the AUTH_SSO_TRUSTED_ISSUERS env value (comma-separated identity
 * provider origins) into the list initAuth expects. Whitespace and empty
 * entries are dropped.
 *
 * Kept in its own module so it imports with no database side effects and can
 * be unit-tested without a live Postgres.
 */
export function parseSsoTrustedIssuers(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}
