import React from "react";
import { Button, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";

import { api, type RouterOutputs } from "../utils/api";

const PostCard: React.FC<{
  post: RouterOutputs["post"]["all"][number];
  onPress: () => void;
  onDelete: () => void;
}> = ({ post, onPress, onDelete }) => {
  return (
    <View className="flex flex-row rounded-lg bg-white/10 p-4">
      <View className="flex-grow">
        <TouchableOpacity onPress={onPress}>
          <Text
            className={`text-xl font-semibold text-[#cc66ff] ${
              !post.title ? "italic" : ""
            }`}
          >
            {post.title || "Untitled"}
          </Text>
          <Text className={`mt-2 text-white ${!post.content ? "italic" : ""}`}>
            {post.content || "No content"}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onDelete}>
        <Text className="font-bold uppercase text-pink-400">Delete</Text>
      </TouchableOpacity>
    </View>
  );
};

const CreatePost: React.FC = () => {
  const utils = api.useContext();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  const { mutate } = api.post.create.useMutation({
    async onSuccess() {
      setTitle("");
      setContent("");
      await utils.post.all.invalidate();
    },
  });

  return (
    <View className="flex flex-col p-4">
      <TextInput
        className="mb-2 rounded bg-white/10 p-2 text-white"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
      />
      <TextInput
        className="mb-2 rounded bg-white/10 p-2 text-white"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={content}
        onChangeText={setContent}
        placeholder="Content"
      />
      <TouchableOpacity
        className="rounded bg-[#cc66ff] p-2"
        onPress={() => {
          mutate({
            title,
            content,
          });
        }}
      >
        <Text className="font-semibold text-white">Publish post</Text>
      </TouchableOpacity>
    </View>
  );
};

export const HomeScreen = () => {
  const postQuery = api.post.all.useQuery();
  const [showPost, setShowPost] = React.useState<string | null>(null);

  const deletePostMutation = api.post.delete.useMutation({
    onSettled: () => postQuery.refetch(),
  });

  return (
    <SafeAreaView className="bg-[#2e026d] bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <View className="h-full w-full p-4">
        <Text className="mx-auto pb-2 text-5xl font-bold text-white">
          Create <Text className="text-[#cc66ff]">T3</Text> Turbo
        </Text>

        <Button
          onPress={() => void postQuery.refetch()}
          title="Refresh posts"
          color={"#cc66ff"}
        />

        <View className="py-2">
          {showPost ? (
            <Text className="text-white">
              <Text className="font-semibold">Selected post: </Text>
              {showPost}
            </Text>
          ) : (
            <Text className="font-semibold italic text-white">
              Press on a post
            </Text>
          )}
        </View>

        <FlashList
          data={postQuery.data}
          estimatedItemSize={20}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={(p) => (
            <PostCard
              post={p.item}
              onPress={() => setShowPost(p.item.id)}
              onDelete={() => deletePostMutation.mutate(p.item.id)}
            />
          )}
        />

        <CreatePost />
      </View>
    </SafeAreaView>
  );
};
