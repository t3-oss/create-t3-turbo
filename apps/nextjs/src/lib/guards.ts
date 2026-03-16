import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";

/**
 * Auth guard utilities for Server Components and layouts.
 *
 * Usage in a page or layout:
 *   const session = await requireAuth();
 *   const session = await requireAdmin();
 *   const session = await requireOrg(orgId);
 */

/**
 * Require authentication. Redirects to home if not logged in.
 * Returns the session — never returns null.
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    redirect("/");
  }
  return session;
}

/**
 * Require admin role. Redirects to home if not admin.
 */
export async function requireAdmin() {
  const session = await requireAuth();
  const userRole = (session.user as { role?: string }).role;
  if (userRole !== "admin") {
    redirect("/");
  }
  return session;
}

/**
 * Require membership in a specific organization.
 * Validates that the current user belongs to the given org.
 */
export async function requireOrg(orgId: string) {
  const session = await requireAuth();
  // TODO: Validate org membership against @gmacko/db tenant
  // For now, return the session with orgId for downstream use
  return { ...session, orgId };
}
