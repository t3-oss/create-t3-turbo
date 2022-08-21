import { SafeAreaView, View, Text } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "@acme/api";
import { trpc } from "../utils/trpc";

const PostCard: React.FC<{
  post: inferProcedureOutput<AppRouter["post"]["all"]>[number];
}> = ({ post }) => {
  return (
    <View className="p-4">
      <Text className="text-2xl font-bold text-gray-800">{post.title}</Text>
      <Text className="text-gray-600">{post.content}</Text>
    </View>
  );
};

export const HomeScreen = () => {
  const postQuery = trpc.post.all.useQuery();

  return (
    <SafeAreaView>
      <View className="h-full w-full">
        <FlashList
          data={postQuery.data}
          estimatedItemSize={20}
          renderItem={(p) => <PostCard post={p.item} />}
        />
      </View>
    </SafeAreaView>
  );
};
