"use client";

import { useState, useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@gmacko/ui/button";
import { Checkbox } from "@gmacko/ui/checkbox";
import { Input } from "@gmacko/ui/input";
import { Label } from "@gmacko/ui/label";
import { toast } from "@gmacko/ui/toast";

import { useTRPC } from "~/trpc/react";

const PERMISSIONS = ["read", "write", "delete", "admin"] as const;

interface _ApiKeyData {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
}

export function ApiKeysSection() {
  const [isPending, startTransition] = useTransition();
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    "read",
  ]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: apiKeys, isLoading } = useQuery(
    trpc.settings.listApiKeys.queryOptions(),
  );

  const createKey = useMutation(
    trpc.settings.createApiKey.mutationOptions({
      onSuccess: (data) => {
        setNewKey(data.key);
        setNewKeyName("");
        setSelectedPermissions(["read"]);
        void queryClient.invalidateQueries({
          queryKey: trpc.settings.listApiKeys.queryKey(),
        });
        toast.success("API key created", {
          description: "Copy your key now — you won't be able to see it again.",
        });
      },
    }),
  );

  const revokeKey = useMutation(
    trpc.settings.revokeApiKey.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.settings.listApiKeys.queryKey(),
        });
        toast.success("API key revoked");
      },
    }),
  );

  const handleCreateKey = () => {
    if (!newKeyName.trim() || selectedPermissions.length === 0) return;

    startTransition(() => {
      createKey.mutate({
        name: newKeyName,
        permissions: selectedPermissions as (
          | "read"
          | "write"
          | "delete"
          | "admin"
        )[],
      });
    });
  };

  const handleRevokeKey = (id: string) => {
    if (
      !confirm(
        "Are you sure you want to revoke this API key? This cannot be undone.",
      )
    ) {
      return;
    }

    startTransition(() => {
      revokeKey.mutate({ id });
    });
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) {
    return (
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">API Keys</h2>
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-16 rounded" />
          <div className="bg-muted h-16 rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">API Keys</h2>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} size="sm">
            Create New Key
          </Button>
        )}
      </div>

      {newKey && (
        <div className="mb-6 rounded-lg border border-green-500 bg-green-50 p-4 dark:bg-green-950">
          <p className="mb-2 font-medium text-green-800 dark:text-green-200">
            API Key Created Successfully
          </p>
          <p className="mb-2 text-sm text-green-700 dark:text-green-300">
            Copy this key now. You won&apos;t be able to see it again.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 rounded bg-white p-2 font-mono text-sm dark:bg-gray-900">
              {newKey}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void copyToClipboard(newKey)}
            >
              Copy
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="mt-2"
            onClick={() => setNewKey(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      {showCreateForm && (
        <div className="mb-6 rounded-lg border p-4">
          <h3 className="mb-4 font-medium">Create New API Key</h3>

          <div className="mb-4">
            <Label htmlFor="keyName" className="mb-2 block">
              Key Name
            </Label>
            <Input
              id="keyName"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="My API Key"
              className="max-w-sm"
            />
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Permissions</Label>
            <div className="flex flex-wrap gap-2">
              {PERMISSIONS.map((permission) => (
                <label key={permission} className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedPermissions.includes(permission)}
                    onCheckedChange={() => togglePermission(permission)}
                  />
                  <span className="capitalize">{permission}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCreateKey}
              disabled={
                isPending ||
                !newKeyName.trim() ||
                selectedPermissions.length === 0
              }
            >
              Create Key
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateForm(false);
                setNewKeyName("");
                setSelectedPermissions(["read"]);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {apiKeys?.length === 0 ? (
          <p className="text-muted-foreground">No API keys created yet.</p>
        ) : (
          apiKeys?.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div>
                <p className="font-medium">{key.name}</p>
                <div className="text-muted-foreground mt-1 flex items-center gap-4 text-sm">
                  <span className="font-mono">{key.keyPrefix}...</span>
                  <span>Permissions: {key.permissions.join(", ")}</span>
                  {key.expiresAt && (
                    <span>
                      Expires: {new Date(key.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {key.lastUsedAt && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Last used: {new Date(key.lastUsedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRevokeKey(key.id)}
                disabled={isPending}
              >
                Revoke
              </Button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
