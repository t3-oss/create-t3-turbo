import { SafeAreaView, Text, View } from "react-native";
import { Stack, useSearchParams } from "expo-router";

import { api } from "../../utils/api";

export default function PostPage() {
  const { id, title } = useSearchParams();
  if (typeof id !== "string" || typeof title !== "string")
    throw new Error("Invalid params");
  const { data: post, isLoading } = api.post.byId.useQuery({ id });

  return (
    <SafeAreaView className="bg-zinc-900">
      <Stack.Screen options={{ title: title }} />
      <View className="h-full w-full p-4">
        <Text className="py-2 text-3xl font-bold text-zinc-200">
          {isLoading ? "Loading..." : post?.title}
        </Text>
        <Text className="py-4 text-zinc-200">{post?.content}</Text>
      </View>
    </SafeAreaView>
  );
}
