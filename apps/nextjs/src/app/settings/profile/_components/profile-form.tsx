"use client";

import { useForm } from "@tanstack/react-form";
import Image from "next/image";
import { z } from "zod/v4";

import { AlertDialog } from "@gmacko/ui/alert-dialog";
import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";
import { Label } from "@gmacko/ui/label";
import { toast } from "@gmacko/ui/toast";

/**
 * Profile form — TanStack Form + Zod validation example.
 *
 * Pattern:
 * 1. Define Zod schema for form data
 * 2. Use `useForm` from @tanstack/react-form
 * 3. Use `form.Field` for each input with validators
 * 4. Wire to tRPC mutation for persistence
 * 5. Show toast on success/error
 *
 * Replace the simulated save with a real tRPC mutation:
 *   const updateProfile = useMutation(trpc.account.updateProfile.mutationOptions({...}));
 */

interface ProfileFormProps {
  user: {
    name: string;
    email: string;
    image?: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const form = useForm({
    defaultValues: {
      name: user.name,
    },
    onSubmit: async ({ value }) => {
      // Validate with Zod
      const result = z
        .object({
          name: z
            .string()
            .min(2, "Name must be at least 2 characters")
            .max(50, "Name must be under 50 characters"),
        })
        .safeParse(value);

      if (!result.success) {
        toast.error("Validation failed", {
          description: result.error.issues[0]?.message,
        });
        return;
      }

      // TODO: Replace with tRPC mutation
      // await updateProfile.mutateAsync({ name: value.name });
      await new Promise((r) => setTimeout(r, 500));

      toast.success("Profile updated", {
        description: "Your changes have been saved.",
      });
    },
  });

  async function handleDeleteAccount() {
    // TODO: Wire to trpc.account.deleteAccount mutation
    toast.error("Account deletion", {
      description:
        "This would delete your account. Wire to tRPC mutation.",
    });
  }

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Avatar</h2>
        <div className="flex items-center gap-6">
          <div className="bg-muted flex h-20 w-20 items-center justify-center overflow-hidden rounded-full">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={80}
                height={80}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast.info("Upload", {
                  description:
                    "Enable @gmacko/storage and wire to UploadThing for avatar uploads.",
                })
              }
            >
              Change Avatar
            </Button>
            <p className="text-muted-foreground mt-1 text-xs">
              JPG, PNG, or GIF. Max 2MB.
            </p>
          </div>
        </div>
      </section>

      {/* Personal Info — TanStack Form */}
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Personal Information</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
          className="grid max-w-md gap-4"
        >
          <form.Field
            name="name"
            validators={{
              onChange: z
                .string()
                .min(2, "Name must be at least 2 characters")
                .max(50, "Name must be under 50 characters"),
            }}
          >
            {(field) => (
              <div>
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  className="mt-1"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="text-destructive mt-1 text-sm" role="alert">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled className="mt-1" />
            <p className="text-muted-foreground mt-1 text-xs">
              Email cannot be changed from here. Contact support for help.
            </p>
          </div>

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || (isSubmitting as boolean)}
                className="w-fit"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </form.Subscribe>
        </form>
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
          <AlertDialog
            trigger={
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            }
            title="Delete your account?"
            description="This action cannot be undone. All your data, projects, and settings will be permanently deleted."
            confirmLabel="Delete Account"
            variant="destructive"
            onConfirm={handleDeleteAccount}
          />
        </div>
      </section>
    </div>
  );
}
