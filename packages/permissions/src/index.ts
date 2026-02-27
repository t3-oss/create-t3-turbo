/**
 * @gmacko/permissions — Fine-Grained RBAC/ABAC Permission System
 *
 * Provides attribute-based access control beyond simple role checks.
 * Supports resource-level permissions, organization scoping, and
 * composable permission policies.
 *
 * Usage:
 *   import { definePermissions, can, createAbility } from "@gmacko/permissions";
 *
 *   const permissions = definePermissions({
 *     user: {
 *       "project.create": true,
 *       "project.read": true,
 *       "project.update": "own",
 *       "project.delete": false,
 *     },
 *     admin: {
 *       "project.*": true,
 *       "user.manage": true,
 *       "billing.manage": true,
 *     },
 *   });
 *
 *   const ability = createAbility(permissions, { role: "user", userId: "123" });
 *   ability.can("project.read"); // true
 *   ability.can("project.delete"); // false
 *   ability.can("project.update", { ownerId: "123" }); // true (owns it)
 */

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * Permission value:
 * - `true`: always allowed
 * - `false`: never allowed
 * - `"own"`: allowed only on resources the user owns
 * - A function for dynamic evaluation
 */
export type PermissionValue =
  | boolean
  | "own"
  | ((context: PermissionContext, resource?: ResourceContext) => boolean);

export type PermissionMap = Record<string, PermissionValue>;

export type RolePermissions = Record<string, PermissionMap>;

export interface PermissionContext {
  userId: string;
  role: string;
  organizationId?: string;
  organizationRole?: string;
  [key: string]: unknown;
}

export interface ResourceContext {
  ownerId?: string;
  organizationId?: string;
  [key: string]: unknown;
}

export interface Ability {
  /** Check if the user can perform an action */
  can(action: string, resource?: ResourceContext): boolean;
  /** Check if the user cannot perform an action */
  cannot(action: string, resource?: ResourceContext): boolean;
  /** Get all allowed actions for the user */
  allowedActions(): string[];
  /** Get the user's context */
  context: PermissionContext;
}

// ─── Core ────────────────────────────────────────────────────────────────────

/**
 * Define permission policies for each role.
 * Supports wildcard patterns (e.g., "project.*").
 */
export function definePermissions<T extends RolePermissions>(permissions: T): T {
  return permissions;
}

/**
 * Check if a specific action matches a permission pattern.
 * Supports wildcards: "project.*" matches "project.read", "project.update", etc.
 */
function matchesPattern(pattern: string, action: string): boolean {
  if (pattern === action) return true;
  if (pattern === "*") return true;

  const patternParts = pattern.split(".");
  const actionParts = action.split(".");

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i] === "*") return true;
    if (patternParts[i] !== actionParts[i]) return false;
  }

  return patternParts.length === actionParts.length;
}

/**
 * Resolve the permission value for an action given a role's permission map.
 * Checks exact match first, then wildcard patterns.
 */
function resolvePermission(
  permissions: PermissionMap,
  action: string,
): PermissionValue | undefined {
  // Exact match
  if (action in permissions) return permissions[action];

  // Wildcard match (most specific first)
  const patterns = Object.keys(permissions)
    .filter((p) => p.includes("*"))
    .sort((a, b) => b.length - a.length);

  for (const pattern of patterns) {
    if (matchesPattern(pattern, action)) {
      return permissions[pattern];
    }
  }

  return undefined;
}

/**
 * Create an ability instance for a user with a specific role.
 */
export function createAbility(
  rolePermissions: RolePermissions,
  context: PermissionContext,
): Ability {
  const permissions = rolePermissions[context.role];

  if (!permissions) {
    // Unknown role — deny everything
    return {
      can: () => false,
      cannot: () => true,
      allowedActions: () => [],
      context,
    };
  }

  function evaluate(action: string, resource?: ResourceContext): boolean {
    const permission = resolvePermission(permissions, action);

    if (permission === undefined) return false;
    if (permission === true) return true;
    if (permission === false) return false;

    if (permission === "own") {
      if (!resource?.ownerId) return false;
      return resource.ownerId === context.userId;
    }

    if (typeof permission === "function") {
      return permission(context, resource);
    }

    return false;
  }

  return {
    can(action: string, resource?: ResourceContext): boolean {
      return evaluate(action, resource);
    },

    cannot(action: string, resource?: ResourceContext): boolean {
      return !evaluate(action, resource);
    },

    allowedActions(): string[] {
      return Object.keys(permissions).filter((action) => {
        if (!action.includes("*")) {
          const value = permissions[action];
          return value === true || value === "own" || typeof value === "function";
        }
        return false;
      });
    },

    context,
  };
}

// ─── Organization-Scoped Permissions ─────────────────────────────────────────

/**
 * Define organization-level role permissions.
 * These layer on top of global permissions.
 */
export type OrgRolePermissions = Record<string, PermissionMap>;

/**
 * Create an ability that merges global and organization permissions.
 * Organization permissions override global ones.
 */
export function createOrgAbility(
  globalPermissions: RolePermissions,
  orgPermissions: OrgRolePermissions,
  context: PermissionContext,
): Ability {
  const globalPerms = globalPermissions[context.role] ?? {};
  const orgPerms = context.organizationRole
    ? (orgPermissions[context.organizationRole] ?? {})
    : {};

  // Org permissions override global
  const merged: PermissionMap = { ...globalPerms, ...orgPerms };

  return createAbility({ [context.role]: merged }, context);
}

// ─── Pre-defined SaaS Permissions ────────────────────────────────────────────

/**
 * Standard SaaS permission set.
 * Extend or override in your project.
 */
export const DEFAULT_PERMISSIONS = definePermissions({
  user: {
    // Projects
    "project.create": true,
    "project.read": true,
    "project.update": "own",
    "project.delete": "own",

    // Profile
    "profile.read": true,
    "profile.update": "own",

    // API Keys
    "api_key.create": true,
    "api_key.read": "own",
    "api_key.revoke": "own",

    // Settings
    "settings.read": "own",
    "settings.update": "own",

    // Billing
    "billing.read": "own",
    "billing.update": "own",
  },

  admin: {
    // Admins can do everything
    "*": true,
  },
});

/**
 * Standard organization-level permissions.
 */
export const DEFAULT_ORG_PERMISSIONS: OrgRolePermissions = {
  owner: {
    "org.*": true,
    "org.delete": true,
    "org.billing.*": true,
    "org.members.*": true,
    "org.settings.*": true,
    "org.sso.*": true,
  },
  admin: {
    "org.members.invite": true,
    "org.members.remove": true,
    "org.members.read": true,
    "org.settings.read": true,
    "org.settings.update": true,
    "org.project.*": true,
  },
  member: {
    "org.members.read": true,
    "org.project.read": true,
    "org.project.create": true,
    "org.project.update": "own",
  },
};
