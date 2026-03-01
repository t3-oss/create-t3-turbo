"use client";

import { useState } from "react";

import { Avatar } from "@gmacko/ui/avatar";
import { Badge } from "@gmacko/ui/badge";
import { Button } from "@gmacko/ui/button";
import { Dialog } from "@gmacko/ui/dialog";
import { Input } from "@gmacko/ui/input";
import { Label } from "@gmacko/ui/label";
import { PageHeader } from "@gmacko/ui/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@gmacko/ui/select";
import { toast } from "@gmacko/ui/toast";
import { Tooltip } from "@gmacko/ui/tooltip";

/**
 * Team page — Member management with invite dialog.
 *
 * This is the reference pattern for:
 * 1. Dialog for creating/editing items (invite member)
 * 2. Tooltip on icon buttons
 * 3. Select component for role assignment
 * 4. Avatar + member list layout
 *
 * Replace mock data with tRPC queries:
 *   const { data } = trpc.organization.listMembers.useQuery();
 *   const invite = trpc.organization.invite.useMutation();
 */

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
  joinedAt: string;
}

const MOCK_MEMBERS: Member[] = [
  { id: "1", name: "Alex Morgan", email: "alex@example.com", role: "owner", joinedAt: "2025-06-15" },
  { id: "2", name: "Jordan Lee", email: "jordan@example.com", role: "admin", joinedAt: "2025-08-20" },
  { id: "3", name: "Sam Chen", email: "sam@example.com", role: "user", joinedAt: "2025-11-01" },
  { id: "4", name: "Taylor Kim", email: "taylor@example.com", role: "user", joinedAt: "2026-01-10" },
  { id: "5", name: "Casey Patel", email: "casey@example.com", role: "user", joinedAt: "2026-02-05" },
];

const roleColors: Record<string, "default" | "secondary" | "outline"> = {
  owner: "default",
  admin: "secondary",
  user: "outline",
};

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");

  function handleInvite() {
    if (!inviteEmail) return;
    const newMember: Member = {
      id: String(members.length + 1),
      name: inviteEmail.split("@")[0] ?? "User",
      email: inviteEmail,
      role: inviteRole,
      joinedAt: new Date().toISOString().split("T")[0] ?? "",
    };
    setMembers((prev) => [...prev, newMember]);
    setInviteEmail("");
    setInviteRole("user");
    setInviteOpen(false);
    toast.success("Invitation sent", {
      description: `Invited ${inviteEmail} as ${inviteRole}`,
    });
  }

  function handleRemove(member: Member) {
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
    toast.success("Member removed", {
      description: `${member.name} has been removed from the team.`,
    });
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description="Manage your team members and their roles."
        breadcrumbs={[
          { label: "Home", href: "/dashboard" },
          { label: "Team" },
        ]}
        actions={
          <Dialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            trigger={<Button>Invite Member</Button>}
            title="Invite Team Member"
            description="Send an invitation to join your team."
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={setInviteRole}
                >
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </Dialog>
        }
      />

      <div className="mt-6 rounded-lg border">
        <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b px-6 py-3 text-sm font-medium">
          <span>Member</span>
          <span className="w-20 text-center">Role</span>
          <span className="hidden w-28 text-center sm:block">Joined</span>
          <span className="w-10" />
        </div>

        {members.map((member) => (
          <div
            key={member.id}
            className="hover:bg-muted/50 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b px-6 py-4 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                {member.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.image}
                    alt={member.name}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-muted text-muted-foreground flex size-full items-center justify-center rounded-full text-sm font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {member.email}
                </p>
              </div>
            </div>

            <Badge variant={roleColors[member.role]} className="w-20 justify-center">
              {member.role}
            </Badge>

            <span className="text-muted-foreground hidden w-28 text-center text-sm sm:block">
              {member.joinedAt}
            </span>

            <div className="flex w-10 justify-end">
              {member.role !== "owner" && (
                <Tooltip content="Remove member">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8"
                    onClick={() => handleRemove(member)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="size-4"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </Button>
                </Tooltip>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
