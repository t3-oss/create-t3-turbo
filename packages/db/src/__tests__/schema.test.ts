import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { deviceCode, ssoProvider, userRoleEnum } from "../auth-schema";
import {
  applicationSettings,
  workspace,
  workspaceInviteAllowlist,
  workspaceMembership,
  workspaceRoleEnum,
} from "../schema";

describe("SaaS workspace schema", () => {
  it("keeps platform roles separate from workspace roles", () => {
    expect(userRoleEnum).toEqual(["user", "admin"]);
    expect(workspaceRoleEnum).toEqual(["owner", "admin", "member"]);
    expect(userRoleEnum).not.toContain("owner");
    expect(userRoleEnum).not.toContain("member");
  });

  it("uses memberships instead of a single owner field on workspaces", () => {
    expect(workspace.id).toBeDefined();
    expect(workspace.slug).toBeDefined();
    expect(workspaceMembership.workspaceId).toBeDefined();
    expect(workspaceMembership.userId).toBeDefined();
    expect(workspaceMembership.role).toBeDefined();
  });

  it("tracks invite allowlist entries separately from memberships", () => {
    const membershipConfig = getTableConfig(workspaceMembership);
    const inviteConfig = getTableConfig(workspaceInviteAllowlist);

    expect(workspaceInviteAllowlist.workspaceId).toBeDefined();
    expect(workspaceInviteAllowlist.email).toBeDefined();
    expect(workspaceInviteAllowlist.invitedByUserId).toBeDefined();
    expect(applicationSettings.initialWorkspaceId).toBeDefined();
    expect(
      membershipConfig.uniqueConstraints.map((constraint) =>
        constraint.getName(),
      ),
    ).toContain("workspace_membership_workspace_user_unique");
    expect(
      inviteConfig.uniqueConstraints.map((constraint) => constraint.getName()),
    ).toContain("workspace_invite_allowlist_workspace_email_unique");
  });

  it("carries the tables the device-authorization plugin expects", () => {
    // Field/model names and constraints must match what better-auth's
    // deviceAuthorization plugin relies on — drift here (the kind a schema
    // regeneration introduces) breaks mobile QR pairing at runtime.
    const config = getTableConfig(deviceCode);
    expect(config.name).toBe("device_code");
    // Column .name is the drizzle property key (snake_case is applied by the
    // client's casing config at query time, not on the column itself).
    expect(config.columns.map((column) => column.name).sort()).toEqual([
      "clientId",
      "deviceCode",
      "expiresAt",
      "id",
      "lastPolledAt",
      "pollingInterval",
      "scope",
      "status",
      "userCode",
      "userId",
    ]);
    // Codes are single-use credentials looked up on every poll/approval:
    // uniqueness is a correctness requirement and provides the hot-path index.
    expect(deviceCode.deviceCode.notNull).toBe(true);
    expect(deviceCode.deviceCode.isUnique).toBe(true);
    expect(deviceCode.userCode.notNull).toBe(true);
    expect(deviceCode.userCode.isUnique).toBe(true);
    expect(deviceCode.expiresAt.notNull).toBe(true);
    expect(deviceCode.status.notNull).toBe(true);
  });

  it("carries the tables the sso plugin expects", () => {
    // Field/model names and constraints must match @better-auth/sso's
    // ssoProvider schema.
    const config = getTableConfig(ssoProvider);
    expect(config.name).toBe("sso_provider");
    expect(config.columns.map((column) => column.name).sort()).toEqual([
      "domain",
      "id",
      "issuer",
      "oidcConfig",
      "organizationId",
      "providerId",
      "samlConfig",
      "userId",
    ]);
    expect(ssoProvider.providerId.notNull).toBe(true);
    expect(ssoProvider.providerId.isUnique).toBe(true);
    expect(ssoProvider.issuer.notNull).toBe(true);
    expect(ssoProvider.domain.notNull).toBe(true);
    // Sign-in resolves providers by email domain on every SSO attempt.
    expect(config.indexes.map((idx) => idx.config.name)).toContain(
      "sso_provider_domain_idx",
    );
  });
});
