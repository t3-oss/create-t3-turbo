import { randomBytes } from "crypto";
import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, eq } from "@gmacko/db";
import {
  organization,
  organizationInvite,
  organizationMember,
  user,
} from "@gmacko/db/schema";

import { protectedProcedure } from "../trpc";

function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    randomBytes(3).toString("hex")
  );
}

function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

export const organizationRouter = {
  /** List organizations the current user belongs to */
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        logo: organization.logo,
        role: organizationMember.role,
        createdAt: organization.createdAt,
      })
      .from(organizationMember)
      .innerJoin(
        organization,
        eq(organizationMember.organizationId, organization.id),
      )
      .where(eq(organizationMember.userId, ctx.session.user.id))
      .orderBy(organization.name);

    return memberships;
  }),

  /** Create a new organization */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug = generateSlug(input.name);

      const [org] = await ctx.db
        .insert(organization)
        .values({ name: input.name, slug })
        .returning();

      if (!org) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create organization",
        });
      }

      // Add the creator as owner
      await ctx.db.insert(organizationMember).values({
        organizationId: org.id,
        userId: ctx.session.user.id,
        role: "owner",
      });

      return org;
    }),

  /** Get organization details by ID (must be a member) */
  byId: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [membership] = await ctx.db
        .select({
          org: organization,
          role: organizationMember.role,
        })
        .from(organizationMember)
        .innerJoin(
          organization,
          eq(organizationMember.organizationId, organization.id),
        )
        .where(
          and(
            eq(organizationMember.userId, ctx.session.user.id),
            eq(organization.id, input.id),
          ),
        )
        .limit(1);

      if (!membership) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found or you are not a member",
        });
      }

      return { ...membership.org, currentUserRole: membership.role };
    }),

  /** List members of an organization */
  members: protectedProcedure
    .input(z.object({ organizationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Verify caller is a member
      const [callerMembership] = await ctx.db
        .select()
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!callerMembership) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const members = await ctx.db
        .select({
          id: organizationMember.id,
          userId: organizationMember.userId,
          role: organizationMember.role,
          createdAt: organizationMember.createdAt,
          userName: user.name,
          userEmail: user.email,
          userImage: user.image,
        })
        .from(organizationMember)
        .innerJoin(user, eq(organizationMember.userId, user.id))
        .where(
          eq(organizationMember.organizationId, input.organizationId),
        )
        .orderBy(organizationMember.createdAt);

      return members;
    }),

  /** Invite a user to an organization (admin/owner only) */
  invite: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["admin", "member"]).default("member"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify caller is admin or owner
      const [callerMembership] = await ctx.db
        .select()
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (
        !callerMembership ||
        (callerMembership.role !== "owner" &&
          callerMembership.role !== "admin")
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and owners can invite members",
        });
      }

      const token = generateInviteToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const [invite] = await ctx.db
        .insert(organizationInvite)
        .values({
          organizationId: input.organizationId,
          email: input.email,
          role: input.role,
          invitedBy: ctx.session.user.id,
          token,
          expiresAt,
        })
        .returning();

      return invite;
    }),

  /** Accept an invitation */
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [invite] = await ctx.db
        .select()
        .from(organizationInvite)
        .where(eq(organizationInvite.token, input.token))
        .limit(1);

      if (!invite) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }

      if (invite.acceptedAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation already accepted",
        });
      }

      if (invite.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invitation has expired",
        });
      }

      // Verify the user's email matches the invite
      const [currentUser] = await ctx.db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, ctx.session.user.id))
        .limit(1);

      if (currentUser?.email !== invite.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation is for a different email address",
        });
      }

      // Add user as member
      await ctx.db.insert(organizationMember).values({
        organizationId: invite.organizationId,
        userId: ctx.session.user.id,
        role: invite.role,
      });

      // Mark invite as accepted
      await ctx.db
        .update(organizationInvite)
        .set({ acceptedAt: new Date() })
        .where(eq(organizationInvite.id, invite.id));

      return { organizationId: invite.organizationId };
    }),

  /** Remove a member (admin/owner only, cannot remove owner) */
  removeMember: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        memberId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify caller is admin or owner
      const [callerMembership] = await ctx.db
        .select()
        .from(organizationMember)
        .where(
          and(
            eq(organizationMember.organizationId, input.organizationId),
            eq(organizationMember.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (
        !callerMembership ||
        (callerMembership.role !== "owner" &&
          callerMembership.role !== "admin")
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Get the target member
      const [target] = await ctx.db
        .select()
        .from(organizationMember)
        .where(eq(organizationMember.id, input.memberId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (target.role === "owner") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot remove the organization owner",
        });
      }

      await ctx.db
        .delete(organizationMember)
        .where(eq(organizationMember.id, input.memberId));

      return { removed: true };
    }),
} satisfies TRPCRouterRecord;
