"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@gmacko/ui/button";

import { useTRPC } from "~/trpc/react";

type UserRole = "user" | "admin";

interface User {
  id: string;
  name: string;
  email: string;
  role: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
}

export function UsersList() {
  const [isPending, startTransition] = useTransition();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(
    trpc.admin.listUsers.queryOptions({ limit: 20 }),
  );

  const updateRole = useMutation(
    trpc.admin.updateUserRole.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.admin.listUsers.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.admin.stats.queryKey(),
        });
      },
    }),
  );

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    startTransition(() => {
      updateRole.mutate({ userId, role: newRole });
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-muted h-20 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-3">
        <div className="text-muted-foreground grid grid-cols-12 gap-4 text-sm font-medium">
          <div className="col-span-4">User</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-2">Joined</div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      <div className="divide-y">
        {data?.users.map((user) => (
          <UserRow
            key={user.id}
            user={user}
            onRoleChange={handleRoleChange}
            isPending={isPending}
          />
        ))}
      </div>

      {data?.users.length === 0 && (
        <div className="text-muted-foreground p-8 text-center">
          No users found.
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  onRoleChange,
  isPending,
}: {
  user: User;
  onRoleChange: (userId: string, role: UserRole) => void;
  isPending: boolean;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRole | null>(null);

  const handleRoleClick = (newRole: UserRole) => {
    if (newRole !== user.role) {
      setPendingRole(newRole);
      setShowConfirm(true);
    }
  };

  const confirmChange = () => {
    if (pendingRole) {
      onRoleChange(user.id, pendingRole);
      setShowConfirm(false);
      setPendingRole(null);
    }
  };

  const cancelChange = () => {
    setShowConfirm(false);
    setPendingRole(null);
  };

  return (
    <div className="grid grid-cols-12 items-center gap-4 px-4 py-3">
      <div className="col-span-4 flex items-center gap-3">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name}
            width={40}
            height={40}
            className="size-10 rounded-full"
          />
        ) : (
          <div className="bg-muted flex size-10 items-center justify-center rounded-full">
            <span className="text-muted-foreground font-medium">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium">{user.name}</p>
          {user.emailVerified && (
            <span className="text-xs text-green-600">Verified</span>
          )}
        </div>
      </div>

      <div className="text-muted-foreground col-span-3 truncate text-sm">
        {user.email}
      </div>

      <div className="col-span-2">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
            user.role === "admin"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {user.role ?? "user"}
        </span>
      </div>

      <div className="text-muted-foreground col-span-2 text-sm">
        {new Date(user.createdAt).toLocaleDateString()}
      </div>

      <div className="col-span-1">
        {showConfirm ? (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="default"
              onClick={confirmChange}
              disabled={isPending}
            >
              Yes
            </Button>
            <Button size="sm" variant="outline" onClick={cancelChange}>
              No
            </Button>
          </div>
        ) : (
          <select
            value={user.role ?? "user"}
            onChange={(e) => handleRoleClick(e.target.value as UserRole)}
            disabled={isPending}
            className="bg-background rounded border px-2 py-1 text-sm"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        )}
      </div>
    </div>
  );
}
