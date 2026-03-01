"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { cn } from "@gmacko/ui";
import { Avatar } from "@gmacko/ui/avatar";
import { Button } from "@gmacko/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@gmacko/ui/dropdown-menu";
import { Input } from "@gmacko/ui/input";
import { toast } from "@gmacko/ui/toast";

import { useTRPC } from "~/trpc/react";

/**
 * Organization / workspace switcher.
 *
 * Displays the active organization in the sidebar header and lets the
 * user switch between orgs or create a new one. Uses the tRPC
 * `organization.list` and `organization.create` queries/mutations.
 *
 * When no organizations exist, shows a "Create workspace" prompt.
 *
 * The active org is stored in localStorage so it persists across
 * page reloads. In a real app you'd also persist this server-side
 * (e.g. in a user preference or cookie).
 */

const ACTIVE_ORG_KEY = "gmacko:active-org";

function getStoredOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_ORG_KEY);
}

function setStoredOrgId(id: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ACTIVE_ORG_KEY, id);
  }
}

export function OrgSwitcher() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: orgs, isLoading } = trpc.organization.list.useQuery();
  const createOrg = trpc.organization.create.useMutation({
    onSuccess: async (newOrg) => {
      await queryClient.invalidateQueries({
        queryKey: trpc.organization.list.queryKey(),
      });
      setStoredOrgId(newOrg.id);
      setActiveOrgId(newOrg.id);
      toast.success("Workspace created", {
        description: `"${newOrg.name}" is now your active workspace.`,
      });
    },
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  // Determine the active org
  const storedId = getStoredOrgId();
  const [activeOrgId, setActiveOrgId] = useState<string | null>(storedId);

  const activeOrg = orgs?.find((o) => o.id === activeOrgId) ?? orgs?.[0];

  // Auto-select first org if none stored
  if (orgs && orgs.length > 0 && !activeOrgId) {
    const firstId = orgs[0]!.id;
    setActiveOrgId(firstId);
    setStoredOrgId(firstId);
  }

  function handleSelect(orgId: string) {
    setActiveOrgId(orgId);
    setStoredOrgId(orgId);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    createOrg.mutate({ name: newOrgName.trim() });
    setNewOrgName("");
    setShowCreate(false);
  }

  if (isLoading) {
    return (
      <div className="flex h-14 items-center border-b px-4">
        <div className="bg-muted h-6 w-6 animate-pulse rounded" />
        <div className="bg-muted ml-2 h-4 w-20 animate-pulse rounded" />
      </div>
    );
  }

  // No orgs — show create prompt
  if (!orgs || orgs.length === 0) {
    return (
      <div className="border-b px-4 py-3">
        {showCreate ? (
          <form onSubmit={handleCreate} className="flex items-center gap-2">
            <Input
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Workspace name"
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" type="submit" disabled={createOrg.isPending}>
              {createOrg.isPending ? "..." : "Create"}
            </Button>
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sm"
            onClick={() => setShowCreate(true)}
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
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8" />
              <path d="M12 8v8" />
            </svg>
            Create workspace
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-14 items-center border-b px-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              "hover:bg-accent flex w-full items-center gap-2 rounded-md p-1.5 text-left transition-colors",
              "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
            )}
          >
            <Avatar className="size-6">
              {activeOrg?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeOrg.logo}
                  alt={activeOrg.name}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <div className="bg-primary text-primary-foreground flex size-full items-center justify-center rounded text-xs font-bold">
                  {activeOrg?.name.charAt(0).toUpperCase() ?? "W"}
                </div>
              )}
            </Avatar>
            <span className="flex-1 truncate text-sm font-semibold">
              {activeOrg?.name ?? "Select workspace"}
            </span>
            {/* Chevron down */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground size-4 shrink-0"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {orgs.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onSelect={() => handleSelect(org.id)}
              className="gap-2"
            >
              <Avatar className="size-5">
                {org.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={org.logo}
                    alt={org.name}
                    className="size-full rounded-full object-cover"
                  />
                ) : (
                  <div className="bg-primary text-primary-foreground flex size-full items-center justify-center rounded text-[10px] font-bold">
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
              <span className="flex-1 truncate text-sm">{org.name}</span>
              {org.id === activeOrg?.id && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary size-4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              <span className="text-muted-foreground text-xs capitalize">
                {org.role}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          {showCreate ? (
            <div className="p-2">
              <form onSubmit={handleCreate} className="flex items-center gap-2">
                <Input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Workspace name"
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setShowCreate(false);
                  }}
                />
                <Button
                  size="sm"
                  type="submit"
                  className="h-7 px-2 text-xs"
                  disabled={createOrg.isPending}
                >
                  Add
                </Button>
              </form>
            </div>
          ) : (
            <DropdownMenuItem onSelect={() => setShowCreate(true)} className="gap-2">
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
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12h8" />
                <path d="M12 8v8" />
              </svg>
              Create workspace
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
