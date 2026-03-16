"use client";

import { useTransition } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@gmacko/ui/button";
import { Label } from "@gmacko/ui/label";
import { Switch } from "@gmacko/ui/switch";
import { toast } from "@gmacko/ui/toast";

import { useTRPC } from "~/trpc/react";

export function PreferencesSection() {
  const [isPending, startTransition] = useTransition();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery(
    trpc.settings.getPreferences.queryOptions(),
  );

  const updatePreferences = useMutation(
    trpc.settings.updatePreferences.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.settings.getPreferences.queryKey(),
        });
        toast.success("Preferences saved");
      },
    }),
  );

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    startTransition(() => {
      updatePreferences.mutate({ theme });
    });
  };

  const handleNotificationToggle = (type: "email" | "push") => {
    if (!preferences) return;

    startTransition(() => {
      if (type === "email") {
        updatePreferences.mutate({
          emailNotifications: !preferences.emailNotifications,
        });
      } else {
        updatePreferences.mutate({
          pushNotifications: !preferences.pushNotifications,
        });
      }
    });
  };

  if (isLoading) {
    return (
      <section className="rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Preferences</h2>
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-10 rounded" />
          <div className="bg-muted h-10 rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border p-6">
      <h2 className="mb-4 text-xl font-semibold">Preferences</h2>

      <div className="space-y-6">
        <div>
          <Label className="mb-2 block">Theme</Label>
          <div className="flex gap-2">
            {(["light", "dark", "system"] as const).map((theme) => (
              <Button
                key={theme}
                variant={preferences?.theme === theme ? "default" : "outline"}
                size="sm"
                onClick={() => handleThemeChange(theme)}
                disabled={isPending}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-3 block">Notifications</Label>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email notifications</p>
                <p className="text-muted-foreground text-xs">
                  Receive email updates about activity
                </p>
              </div>
              <Switch
                checked={preferences?.emailNotifications ?? true}
                onCheckedChange={() => handleNotificationToggle("email")}
                disabled={isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Push notifications</p>
                <p className="text-muted-foreground text-xs">
                  Receive push notifications on your devices
                </p>
              </div>
              <Switch
                checked={preferences?.pushNotifications ?? true}
                onCheckedChange={() => handleNotificationToggle("push")}
                disabled={isPending}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
