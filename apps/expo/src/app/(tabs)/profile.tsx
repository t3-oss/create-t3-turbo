import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  supportedLocales,
  useLocaleNative,
  useTranslationsNative,
} from "@gmacko/i18n/native";

import { Avatar, Badge } from "~/components/avatar";
import { Card } from "~/components/card";
import { LoadingSpinner } from "~/components/loading";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { setLocale } from "~/utils/i18n";

/**
 * Profile tab — account info, organization switcher, preferences, and sign out.
 *
 * Sections:
 * 1. User card (name, email, avatar)
 * 2. Workspaces (org switcher with create)
 * 3. Preferences (theme, language, notifications)
 * 4. Account actions (sign out, danger zone)
 */
export default function ProfileScreen() {
  const { data: session } = authClient.useSession();
  const t = useTranslationsNative();

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="items-center border-b border-zinc-200 px-6 py-6 dark:border-zinc-800">
          <Avatar name={session?.user?.name} size="lg" />
          <Text className="text-foreground mt-3 text-xl font-bold">
            {session?.user?.name ?? "User"}
          </Text>
          <Text className="text-muted-foreground text-sm">
            {session?.user?.email}
          </Text>
        </View>

        {/* Workspaces */}
        <WorkspacesSection />

        {/* Preferences */}
        <PreferencesSection />

        {/* Account actions */}
        <View className="mt-6 px-6">
          <Text className="text-foreground mb-3 text-lg font-semibold">
            Account
          </Text>

          <Pressable
            onPress={() => {
              Alert.alert("Sign out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Sign out",
                  style: "destructive",
                  onPress: () => authClient.signOut(),
                },
              ]);
            }}
            className="border-border bg-card rounded-xl border p-4"
          >
            <Text className="text-destructive text-center font-semibold">
              Sign out
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Alert.alert(
                "Delete account",
                "This action is permanent and cannot be undone. All your data will be deleted.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete my account",
                    style: "destructive",
                    onPress: () => {
                      // TODO: call trpc.account.deleteAccount
                    },
                  },
                ],
              );
            }}
            className="border-destructive mt-3 rounded-xl border p-4"
          >
            <Text className="text-destructive text-center text-sm">
              Delete account
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function WorkspacesSection() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");

  const { data: orgs, isLoading } = useQuery(
    trpc.organization.list.queryOptions(),
  );

  const createOrg = useMutation(
    trpc.organization.create.mutationOptions({
      onSuccess: () => {
        setNewOrgName("");
        setShowCreate(false);
        void queryClient.invalidateQueries(
          trpc.organization.list.queryFilter(),
        );
      },
    }),
  );

  function handleCreate() {
    if (!newOrgName.trim()) return;
    createOrg.mutate({ name: newOrgName.trim() });
  }

  return (
    <View className="mt-6 px-6">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-foreground text-lg font-semibold">
          Workspaces
        </Text>
        <Pressable onPress={() => setShowCreate(true)}>
          <Text className="text-primary text-sm font-medium">+ New</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <Card>
          <LoadingSpinner />
        </Card>
      ) : !orgs || orgs.length === 0 ? (
        <Card>
          <Text className="text-muted-foreground text-center text-sm">
            No workspaces yet. Create one to collaborate with your team.
          </Text>
          <Pressable
            onPress={() => setShowCreate(true)}
            className="bg-primary mt-3 items-center rounded-lg py-2.5"
          >
            <Text className="text-primary-foreground font-medium">
              Create workspace
            </Text>
          </Pressable>
        </Card>
      ) : (
        <View className="gap-2">
          {orgs.map((org) => (
            <Card key={org.id}>
              <View className="flex-row items-center gap-3">
                <View className="bg-primary h-10 w-10 items-center justify-center rounded-lg">
                  <Text className="text-primary-foreground text-sm font-bold">
                    {org.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-medium">{org.name}</Text>
                  <Text className="text-muted-foreground text-xs">
                    {org.slug}
                  </Text>
                </View>
                <Badge label={org.role} variant="secondary" />
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* Create workspace modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreate(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => setShowCreate(false)}
        >
          <View className="bg-background rounded-t-3xl p-6">
            <Text className="text-foreground mb-4 text-lg font-semibold">
              Create workspace
            </Text>
            <TextInput
              value={newOrgName}
              onChangeText={setNewOrgName}
              placeholder="Workspace name"
              autoFocus
              className="border-border bg-background text-foreground mb-4 rounded-lg border px-4 py-3"
              placeholderTextColor="#A1A1AA"
            />
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowCreate(false)}
                className="border-border flex-1 items-center rounded-lg border py-3"
              >
                <Text className="text-foreground font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={createOrg.isPending || !newOrgName.trim()}
                className="bg-primary flex-1 items-center rounded-lg py-3"
                style={{ opacity: createOrg.isPending ? 0.7 : 1 }}
              >
                <Text className="text-primary-foreground font-semibold">
                  {createOrg.isPending ? "Creating..." : "Create"}
                </Text>
              </Pressable>
            </View>
            <View className="h-8" />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function PreferencesSection() {
  const queryClient = useQueryClient();
  const currentLocale = useLocaleNative();

  const { data: preferences, isLoading } = useQuery(
    trpc.settings.getPreferences.queryOptions(),
  );

  const { mutate: updatePreferences } = useMutation(
    trpc.settings.updatePreferences.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(
          trpc.settings.getPreferences.queryFilter(),
        );
      },
    }),
  );

  function handleThemeChange(theme: "light" | "dark" | "system") {
    updatePreferences({ theme });
  }

  function handleLanguageChange(lang: string) {
    void setLocale(lang);
    updatePreferences({ language: lang });
  }

  function toggleNotification(type: "email" | "push") {
    if (!preferences) return;
    if (type === "email") {
      updatePreferences({
        emailNotifications: !preferences.emailNotifications,
      });
    } else {
      updatePreferences({
        pushNotifications: !preferences.pushNotifications,
      });
    }
  }

  if (isLoading) {
    return (
      <View className="mt-6 px-6">
        <Text className="text-foreground mb-3 text-lg font-semibold">
          Preferences
        </Text>
        <Card>
          <LoadingSpinner />
        </Card>
      </View>
    );
  }

  return (
    <View className="mt-6 px-6">
      <Text className="text-foreground mb-3 text-lg font-semibold">
        Preferences
      </Text>

      <Card>
        {/* Theme */}
        <Text className="text-foreground mb-2 text-sm font-medium">Theme</Text>
        <View className="mb-4 flex-row gap-2">
          {(["light", "dark", "system"] as const).map((theme) => (
            <Pressable
              key={theme}
              onPress={() => handleThemeChange(theme)}
              className={`flex-1 items-center rounded-lg py-2.5 ${
                preferences?.theme === theme
                  ? "bg-primary"
                  : "border-border bg-background border"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  preferences?.theme === theme
                    ? "text-primary-foreground"
                    : "text-foreground"
                }`}
              >
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Language */}
        <Text className="text-foreground mb-2 text-sm font-medium">
          Language
        </Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {supportedLocales.map((lang) => (
            <Pressable
              key={lang}
              onPress={() => handleLanguageChange(lang)}
              className={`rounded-lg px-4 py-2 ${
                currentLocale === lang
                  ? "bg-primary"
                  : "border-border bg-background border"
              }`}
            >
              <Text
                className={`text-sm ${
                  currentLocale === lang
                    ? "text-primary-foreground font-semibold"
                    : "text-foreground"
                }`}
              >
                {lang.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Notification toggles */}
        <Text className="text-foreground mb-2 text-sm font-medium">
          Notifications
        </Text>
        <View className="gap-3">
          <Pressable
            onPress={() => toggleNotification("email")}
            className="flex-row items-center justify-between"
          >
            <Text className="text-foreground text-sm">Email notifications</Text>
            <View
              className={`h-6 w-11 rounded-full p-0.5 ${
                preferences?.emailNotifications
                  ? "bg-primary"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <View
                className={`h-5 w-5 rounded-full bg-white shadow ${
                  preferences?.emailNotifications
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </View>
          </Pressable>
          <Pressable
            onPress={() => toggleNotification("push")}
            className="flex-row items-center justify-between"
          >
            <Text className="text-foreground text-sm">Push notifications</Text>
            <View
              className={`h-6 w-11 rounded-full p-0.5 ${
                preferences?.pushNotifications
                  ? "bg-primary"
                  : "bg-zinc-300 dark:bg-zinc-700"
              }`}
            >
              <View
                className={`h-5 w-5 rounded-full bg-white shadow ${
                  preferences?.pushNotifications
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </View>
          </Pressable>
        </View>
      </Card>
    </View>
  );
}
