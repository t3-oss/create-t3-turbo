import React from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Link, Stack } from "expo-router";
import { FlashList } from "@shopify/flash-list";

import type { RouterOutputs } from "../utils/api";
import { AuthAvatar } from "../components/header";
import { api } from "../utils/api";

function PostCard(props: { post: RouterOutputs["post"]["all"][number] }) {
  const { post } = props;

  const utils = api.useUtils();

  const { mutate: deletePost } = api.post.delete.useMutation({
    onSettled: () => utils.post.all.invalidate(),
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED")
        Alert.alert("Error", "Only the author can delete their post");
    },
  });

  return (
    <View className="flex flex-row rounded-lg bg-white/10 p-4">
      <View className="flex-grow">
        <Link
          asChild
          href={{
            pathname: "/post/[id]",
            params: { id: props.post.id },
          }}
        >
          <Pressable>
            <Image
              className="mr-2 h-10 w-10 self-center rounded-full"
              source={post.author?.image ?? ""}
            />
            <View>
              <Text className="text-xl font-semibold text-emerald-400">
                {post.title}
              </Text>
              <Text className="mt-2 text-zinc-200">{post.content}</Text>
            </View>
          </Pressable>
        </Link>
      </View>
      <Pressable onPress={() => deletePost(post.id)}>
        <Text className="font-bold uppercase text-emerald-400">Delete</Text>
      </Pressable>
    </View>
  );
}

function CreatePost() {
  const utils = api.useUtils();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  const { mutate: createPost, error } = api.post.create.useMutation({
    onSuccess: async () => {
      setTitle("");
      setContent("");
      Keyboard.dismiss();
      await utils.post.all.invalidate();
    },
    onError: (error) => {
      if (error.data?.code === "UNAUTHORIZED")
        Alert.alert("Error", "You must be logged in to create a post");
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={150}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} className="flex-1">
        <View className="mt-4 justify-around">
          <TextInput
            className="mb-2 rounded bg-white/10 p-2 text-zinc-200"
            placeholderTextColor="#A1A1A9" // zinc-400
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
            className="mb-2 rounded bg-white/10 p-2 text-zinc-200"
            placeholderTextColor="#A1A1A9" // zinc-400
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
            className="rounded bg-emerald-400 p-2"
            onPress={() => {
              createPost({
                title,
                content,
              });
            }}
          >
            <Text className="font-semibold text-zinc-900">Publish post</Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

export default function HomeScreen() {
  const utils = api.useUtils();

  const { data: posts } = api.post.all.useQuery();

  return (
    <SafeAreaView className="bg-zinc-900">
      <Stack.Screen
        options={{
          headerLeft: () => <AuthAvatar />,
          headerTitle: () => (
            <Text className="text-3xl font-bold text-zinc-200">
              <Text className="text-fuchsia-500">T3</Text>
              <Text> x </Text>
              <Text className="text-emerald-400">Supabase</Text>
            </Text>
          ),
        }}
      />
      <View className="h-full w-full p-4">
        <Pressable
          className="my-4 rounded bg-emerald-400 p-2"
          onPress={() => void utils.post.all.invalidate()}
        >
          <Text className="font-semibold text-zinc-900">Refresh posts</Text>
        </Pressable>

        <FlashList
          data={posts}
          estimatedItemSize={20}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={(p) => <PostCard post={p.item} />}
        />

        <CreatePost />
      </View>
    </SafeAreaView>
  );
}
