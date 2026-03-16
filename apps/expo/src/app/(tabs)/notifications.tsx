import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { EmptyState } from "~/components/empty-state";

/**
 * Notifications tab — in-app notification center.
 *
 * Shows a list of notifications with read/unread state,
 * mark-as-read, and mark-all-as-read.
 *
 * Uses mock data for now — wire up to tRPC `notification.list`
 * when ready:
 *   const { data } = useQuery(trpc.notification.list.queryOptions());
 *   const markRead = useMutation(trpc.notification.markAsRead.mutationOptions(...));
 *   const markAllRead = useMutation(trpc.notification.markAllAsRead.mutationOptions(...));
 */

interface Notification {
  id: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
  createdAt: Date;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Welcome to Gmacko!",
    body: "Your account has been created. Start by creating your first project.",
    type: "success",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
  {
    id: "2",
    title: "New team member",
    body: "Jane Doe accepted your invite to join Acme Corp.",
    type: "info",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "3",
    title: "Project deployed",
    body: 'Your project "Landing Page" was deployed to production successfully.',
    type: "success",
    href: "/post/1",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
  {
    id: "4",
    title: "Usage alert",
    body: "You've used 80% of your API calls this month. Consider upgrading your plan.",
    type: "warning",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
  {
    id: "5",
    title: "Subscription renewed",
    body: "Your Pro plan has been renewed for another month.",
    type: "info",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
  },
  {
    id: "6",
    title: "Security alert",
    body: "A new device signed in to your account from San Francisco, CA.",
    type: "warning",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
  },
];

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${String(minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${String(hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `${String(days)}d ago`;
}

const TYPE_INDICATOR: Record<Notification["type"], string> = {
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] =
    useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handlePress(notification: Notification) {
    markAsRead(notification.id);
    if (notification.href) {
      router.push(notification.href as never);
    }
  }

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <View>
          <Text className="text-foreground text-2xl font-bold">
            Notifications
          </Text>
          {unreadCount > 0 && (
            <Text className="text-muted-foreground text-xs">
              {unreadCount} unread
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable onPress={markAllAsRead}>
            <Text className="text-primary text-sm font-medium">
              Mark all read
            </Text>
          </Pressable>
        )}
      </View>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Text className="text-muted-foreground text-2xl">&#128276;</Text>}
          title="No notifications"
          description="You're all caught up. We'll notify you when something happens."
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-4"
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                /* TODO: refetch from tRPC */
              }}
            />
          }
        >
          {notifications.map((notification) => (
            <Pressable
              key={notification.id}
              onPress={() => handlePress(notification)}
              className={`border-b border-zinc-100 px-6 py-4 dark:border-zinc-900 ${
                !notification.read ? "bg-primary/5" : ""
              }`}
            >
              <View className="flex-row items-start gap-3">
                {/* Type indicator dot */}
                <View
                  className={`mt-1.5 h-2.5 w-2.5 rounded-full ${TYPE_INDICATOR[notification.type]}`}
                />

                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-foreground text-sm ${
                        !notification.read ? "font-semibold" : ""
                      }`}
                    >
                      {notification.title}
                    </Text>
                    <Text className="text-muted-foreground text-xs">
                      {timeAgo(notification.createdAt)}
                    </Text>
                  </View>
                  <Text
                    className="text-muted-foreground mt-0.5 text-sm"
                    numberOfLines={2}
                  >
                    {notification.body}
                  </Text>
                </View>

                {/* Unread indicator */}
                {!notification.read && (
                  <View className="bg-primary mt-1.5 h-2 w-2 rounded-full" />
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
