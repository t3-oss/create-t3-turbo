import { SafeAreaView, View, Text, TouchableOpacity, TextInput } from "react-native";
import { FlashList } from "@shopify/flash-list";
import type { inferProcedureOutput } from "@trpc/server";
import type { AppRouter } from "@acme/api";
import { trpc } from "../utils/trpc";
import React from "react";

const PostCard: React.FC<{
  post: inferProcedureOutput<AppRouter["post"]["all"]>[number];
}> = ({ post }) => {
  return (
    <View className="p-4 border-2 border-gray-500 rounded-lg">
      <Text className="text-xl font-semibold text-gray-800">{post.title}</Text>
      <Text className="text-gray-600">{post.content}</Text>
    </View>
  );
};

const CreatePost: React.FC = () => {
  const utils = trpc.useContext();
  const { mutate } = trpc.post.create.useMutation({
    async onSuccess() {
      await utils.post.all.invalidate();
    },
  });

  const [title, onChangeTitle] = React.useState("");
  const [content, onChangeContent] = React.useState("");

  return (
    <View className="p-4 border-t-2 border-gray-500 flex flex-col">
      <TextInput
        className="border-2 border-gray-500 rounded p-2 mb-2"
        onChangeText={onChangeTitle}
        placeholder="Title"
      />
      <TextInput
        className="border-2 border-gray-500 rounded p-2 mb-2"
        onChangeText={onChangeContent}
        placeholder="Content"
      />
      <TouchableOpacity
        className="bg-indigo-500 rounded p-2"
        onPress={() => {
          mutate({
            title,
            content,
          });
        }}
      >
        <Text className="text-white font-semibold">Publish post</Text>
      </TouchableOpacity>
    </View>
  );
};

export const HomeScreen = () => {
  const postQuery = trpc.post.all.useQuery();
  const [showPost, setShowPost] = React.useState<string | null>(null);

  return (
    <SafeAreaView>
      <View className="h-full w-full p-4">
        <Text className="text-5xl font-bold mx-auto pb-2">
          Create <Text className="text-indigo-500">T3</Text> Turbo
        </Text>

        <View className="py-2">
          {showPost ? (
            <Text>
              <Text className="font-semibold">Selected post:</Text>
              {showPost}
            </Text>
          ) : (
            <Text className="italic font-semibold">Press on a post</Text>
          )}
        </View>

        <FlashList
          data={postQuery.data}
          estimatedItemSize={20}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={(p) => (
            <TouchableOpacity onPress={() => setShowPost(p.item.id)}>
              <PostCard post={p.item} />
            </TouchableOpacity>
          )}
        />

        <CreatePost />
      </View>
    </SafeAreaView>
  );
};
