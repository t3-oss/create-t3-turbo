"use client";

import { useState } from "react";

import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";
import { Label } from "@gmacko/ui/label";

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    image?: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // In a real implementation, this would call a tRPC mutation
    await new Promise((r) => setTimeout(r, 500));
    setIsSaving(false);
  };

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Avatar</h2>
        <div className="flex items-center gap-6">
          <div className="bg-muted flex h-20 w-20 items-center justify-center overflow-hidden rounded-full">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-muted-foreground text-2xl font-medium">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <Button variant="outline" size="sm">
              Change Avatar
            </Button>
            <p className="text-muted-foreground mt-1 text-xs">
              JPG, PNG, or GIF. Max 2MB.
            </p>
          </div>
        </div>
      </section>

      {/* Personal Info */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Personal Information</h2>
        <div className="grid max-w-md gap-4">
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user.email}
              disabled
              className="mt-1"
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Email cannot be changed from here. Contact support for help.
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving || name === user.name}
            className="w-fit"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-lg border border-red-200 p-6 dark:border-red-900">
        <h2 className="mb-4 text-xl font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Delete Account</p>
            <p className="text-muted-foreground text-sm">
              Permanently delete your account and all associated data.
            </p>
          </div>
          <Button variant="destructive" size="sm">
            Delete Account
          </Button>
        </div>
      </section>
    </div>
  );
}
