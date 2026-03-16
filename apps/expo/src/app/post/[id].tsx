import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { Card } from "~/components/card";
import { LoadingSpinner } from "~/components/loading";
import { trpc } from "~/utils/api";

/**
 * Post/project detail screen — pushed as a stack screen on top of tabs.
 */
export default function PostDetail() {
  const { id } = useGlobalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading } = useQuery(trpc.post.byId.queryOptions({ id }));

  if (isLoading) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <Stack.Screen options={{ title: "Loading..." }} />
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center px-6">
        <Stack.Screen options={{ title: "Not Found" }} />
        <Text className="text-foreground mb-2 text-lg font-bold">
          Project not found
        </Text>
        <Text className="text-muted-foreground mb-4 text-center text-sm">
          This project may have been deleted or you don't have access.
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="bg-primary rounded-lg px-6 py-3"
        >
          <Text className="text-primary-foreground font-medium">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="bg-background flex-1">
      <Stack.Screen options={{ title: data.title }} />
      <ScrollView className="flex-1 p-6">
        <Text className="text-foreground text-2xl font-bold">{data.title}</Text>

        <View className="mt-2 flex-row gap-2">
          <Text className="text-muted-foreground text-xs">
            Created {new Date(data.createdAt).toLocaleDateString()}
          </Text>
          {data.updatedAt && (
            <Text className="text-muted-foreground text-xs">
              &middot; Updated{" "}
              {new Date(data.updatedAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        <Card className="mt-6">
          <Text className="text-foreground text-base leading-6">
            {data.content}
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
