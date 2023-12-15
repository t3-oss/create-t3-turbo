import { SafeAreaView, Text, View } from "react-native";
import { Stack, useGlobalSearchParams } from "expo-router";

import { api } from "~/utils/api";

export default function Post() {
  const { id } = useGlobalSearchParams();
  if (!id || typeof id !== "string") throw new Error("unreachable");
  const { data: post } = api.post.byId.useQuery({ id });

  if (!post) return null;

  return (
    <SafeAreaView className="bg-zinc-900">
      <Stack.Screen options={{ title: post.title }} />
      <View className="h-full w-full p-4">
        <Text className="py-2 text-3xl font-bold text-zinc-200">
          {post.title}
        </Text>
        <Text className="py-4 text-zinc-200">{post?.content}</Text>
      </View>
    </SafeAreaView>
  );
}
