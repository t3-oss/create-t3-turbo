import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslationsNative } from "@gmacko/i18n/native";

import { Avatar } from "~/components/avatar";
import { Card, StatCard } from "~/components/card";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

/**
 * Home / Dashboard tab — overview of the user's workspace.
 *
 * Shows:
 * - Greeting with avatar
 * - Key stats (projects, team, notifications)
 * - Recent posts (as a proxy for recent activity)
 * - Quick actions
 */
export default function HomeScreen() {
  const t = useTranslationsNative();
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const { data: posts, isRefreshing } = useQuery({
    ...trpc.post.all.queryOptions(),
    select: (data) => data.slice(0, 5),
  });

  const { data: orgs } = useQuery(trpc.organization.list.queryOptions());

  const handleRefresh = () => {
    void queryClient.invalidateQueries();
  };

  const userName = session?.user?.name ?? "there";
  const greeting = getGreeting();

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-4 pb-6">
          <View className="flex-1">
            <Text className="text-muted-foreground text-sm">{greeting}</Text>
            <Text className="text-foreground text-2xl font-bold">
              {userName}
            </Text>
          </View>
          <Avatar name={session?.user?.name} size="lg" />
        </View>

        {/* Stats row */}
        <View className="flex-row gap-3 px-6">
          <StatCard
            label="Projects"
            value={String(posts?.length ?? 0)}
            trend={{ value: "12%", positive: true }}
          />
          <StatCard
            label="Workspaces"
            value={String(orgs?.length ?? 0)}
          />
        </View>

        {/* Quick actions */}
        <View className="mt-6 px-6">
          <Text className="text-foreground mb-3 text-lg font-semibold">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <Link href="/(tabs)/projects" asChild>
              <Pressable className="border-border bg-card flex-1 items-center rounded-xl border p-4">
                <Text className="text-foreground mb-1 text-2xl">+</Text>
                <Text className="text-foreground text-xs font-medium">
                  New Project
                </Text>
              </Pressable>
            </Link>
            <Link href="/(tabs)/notifications" asChild>
              <Pressable className="border-border bg-card flex-1 items-center rounded-xl border p-4">
                <Text className="text-foreground mb-1 text-2xl">&#9993;</Text>
                <Text className="text-foreground text-xs font-medium">
                  Notifications
                </Text>
              </Pressable>
            </Link>
            <Link href="/(tabs)/profile" asChild>
              <Pressable className="border-border bg-card flex-1 items-center rounded-xl border p-4">
                <Text className="text-foreground mb-1 text-2xl">&#9881;</Text>
                <Text className="text-foreground text-xs font-medium">
                  Settings
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        {/* Recent activity */}
        <View className="mt-6 px-6">
          <Text className="text-foreground mb-3 text-lg font-semibold">
            Recent Activity
          </Text>
          {!posts || posts.length === 0 ? (
            <Card>
              <Text className="text-muted-foreground text-center text-sm">
                No recent activity. Create your first project to get started.
              </Text>
            </Card>
          ) : (
            <View className="gap-2">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={{ pathname: "/post/[id]", params: { id: post.id } }}
                  asChild
                >
                  <Pressable>
                    <Card>
                      <Text className="text-foreground font-medium">
                        {post.title}
                      </Text>
                      <Text
                        className="text-muted-foreground mt-1 text-sm"
                        numberOfLines={2}
                      >
                        {post.content}
                      </Text>
                      <Text className="text-muted-foreground mt-2 text-xs">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </Text>
                    </Card>
                  </Pressable>
                </Link>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 18) return "Good afternoon,";
  return "Good evening,";
}
