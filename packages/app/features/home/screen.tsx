import React from "react";
import { Button } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "solito/router";

import { Pressable, TextInput, View } from "@acme/app/design/layout";
import { Text } from "@acme/app/design/typography";
import { api, type RouterOutputs } from "@acme/app/utils/api";
import { Stack } from "@acme/app/utils/stack";

const PostCard: React.FC<{
  post: RouterOutputs["post"]["all"][number];
  onDelete: () => void;
}> = ({ post, onDelete }) => {
  const router = useRouter();

  return (
    <View className="flex flex-row rounded-lg bg-white/10 p-4">
      <View className="flex-grow">
        <Pressable onPress={() => router.push(`/post/${post.id}`)}>
          <Text className="text-xl font-semibold text-pink-400">
            {post.title}
          </Text>
          <Text className="mt-2 text-white">{post.content}</Text>
        </Pressable>
      </View>
      <Pressable onPress={onDelete}>
        <Text className="font-bold uppercase text-pink-400">Delete</Text>
      </Pressable>
    </View>
  );
};

const CreatePost: React.FC = () => {
  const utils = api.useContext();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  const { mutate, error } = api.post.create.useMutation({
    async onSuccess() {
      setTitle("");
      setContent("");
      await utils.post.all.invalidate();
    },
  });

  return (
    <View className="my-4">
      <TextInput
        className="mb-2 rounded bg-white/10 p-2 text-white"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
      />
      {error?.data?.zodError?.fieldErrors.title && (
        <Text className="mb-2 text-red-500">
          {error.data.zodError.fieldErrors.title}
        </Text>
      )}
      <TextInput
        className="mb-2 rounded bg-white/10 p-2 text-white"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        value={content}
        onChangeText={setContent}
        placeholder="Content"
      />
      {error?.data?.zodError?.fieldErrors.content && (
        <Text className="mb-2 text-red-500">
          {error.data.zodError.fieldErrors.content}
        </Text>
      )}
      <Pressable
        className="rounded bg-pink-400 p-2"
        onPress={() => {
          mutate({
            title,
            content,
          });
        }}
      >
        <Text className="font-semibold text-white">Publish post</Text>
      </Pressable>
    </View>
  );
};

const Index = () => {
  const utils = api.useContext();

  const postQuery = api.post.all.useQuery();

  const deletePostMutation = api.post.delete.useMutation({
    onSettled: () => utils.post.all.invalidate(),
  });

  return (
    <View className="flex-1 bg-[#1F104A]">
      <Stack.Screen options={{ title: "Create T3 Turbo + Solito" }} />
      <View className="mx-auto h-full w-full max-w-2xl p-4">
        <Text className="mx-auto pb-2 text-3xl font-bold text-white">
          Create <Text className="text-pink-400">T3</Text> Turbo + Solito
        </Text>

        <Button
          onPress={() => void utils.post.all.invalidate()}
          title="Refresh posts"
          color={"#f472b6"}
        />

        <View className="py-2">
          <Text className="font-semibold italic text-white">
            Press on a post
          </Text>
        </View>

        <FlashList
          data={postQuery.data}
          estimatedItemSize={20}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={(p) => (
            <PostCard
              post={p.item}
              onDelete={() => deletePostMutation.mutate(p.item.id)}
            />
          )}
        />

        <CreatePost />
      </View>
    </View>
  );
};

export default Index;
