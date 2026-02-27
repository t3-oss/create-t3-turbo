/**
 * App-level constants — single source of truth for navigation,
 * feature names, and other cross-cutting values.
 *
 * Import: import { APP_NAME, NAV_ITEMS, ... } from "~/constants";
 *
 * WHY: Centralizing these prevents navigation items, labels, and
 * routes from drifting across layouts, sidebars, command palette,
 * and breadcrumbs.
 */

export const APP_NAME = "My App";
export const APP_DESCRIPTION = "Production-ready SaaS application.";
export const SUPPORT_EMAIL = "support@gmacko.dev";

/** Main app navigation items — used by AppSidebar and CommandPalette */
export const NAV_ITEMS = [
  { title: "Dashboard", href: "/dashboard", group: "navigation" },
  { title: "Projects", href: "/projects", group: "navigation" },
  { title: "Team", href: "/team", group: "navigation" },
  { title: "Analytics", href: "/analytics", group: "navigation" },
] as const;

/** Settings navigation — used by settings layout sidebar */
export const SETTINGS_NAV = [
  { label: "General", href: "/settings" },
  { label: "Profile", href: "/settings/profile" },
  { label: "Billing", href: "/settings/billing" },
  { label: "Sessions", href: "/settings/sessions" },
] as const;

/** Admin navigation — used by AdminSidebar */
export const ADMIN_NAV = [
  { title: "Dashboard", href: "/admin" },
  { title: "Users", href: "/admin/users" },
] as const;

/** API key permission options */
export const API_KEY_PERMISSIONS = [
  { key: "read", label: "Read", description: "Read access to resources" },
  { key: "write", label: "Write", description: "Create and update resources" },
  { key: "delete", label: "Delete", description: "Delete resources" },
  { key: "admin", label: "Admin", description: "Full administrative access" },
] as const;

/** User roles */
export const USER_ROLES = ["user", "admin", "owner"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
