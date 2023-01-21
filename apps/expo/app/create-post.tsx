import { Link, useRouter } from "expo-router";
import React from "react";
import { Button, SafeAreaView, TextInput, View, Text } from "react-native";
import { api } from "../src/utils/api";

const CreatePost: React.FC = () => {
  const utils = api.useContext();
  const router = useRouter();

  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");

  const { mutate } = api.post.create.useMutation({
    async onSuccess() {
      setTitle("");
      setContent("");
      await utils.post.all.invalidate();

      router.push("/");
    },
  });

  return (
    <SafeAreaView className="bg-[#2e026d] bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <View className="h-full w-full p-4">
        <Text className="mx-auto mt-8 pb-2 text-5xl font-bold text-white">
          New <Text className="text-[#cc66ff]">post</Text>
        </Text>

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

          <Button
            title="Publish post"
            onPress={() => {
              mutate({
                title,
                content,
              });
            }}
            color={"#cc66ff"}
          />
        </View>

        <Link href={"/"}>
          <Text className="text-xl text-pink-600">View posts</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
};

export default CreatePost;
