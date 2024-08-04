import { useState } from "react";
import {
  Button,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Stack, useRouter } from "expo-router";

import type { RouterOutputs } from "~/utils/api";
import { api } from "~/utils/api";
import { useSignOut, useUser } from "~/utils/auth";
import { setToken } from "~/utils/session-store";

function PostCard(props: {
  post: RouterOutputs["post"]["all"]["docs"][number];
  onDelete: () => void;
}) {
  return (
    <View className="flex flex-row rounded-lg bg-muted p-4">
      <View className="flex-grow">
        <Link
          asChild
          href={{
            pathname: "/post/[id]",
            params: { id: props.post.id },
          }}
        >
          <Pressable className="">
            <Text className="text-xl font-semibold text-primary">
              {props.post.title}
            </Text>
            <Text className="mt-2 text-foreground">{props.post.content}</Text>
          </Pressable>
        </Link>
      </View>
      <Pressable onPress={props.onDelete}>
        <Text className="font-bold uppercase text-primary">Delete</Text>
      </Pressable>
    </View>
  );
}

function CreatePost() {
  const utils = api.useUtils();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { mutate, error } = api.post.create.useMutation({
    async onSuccess() {
      setTitle("");
      setContent("");
      await utils.post.all.invalidate();
    },
  });

  return (
    <View className="mt-4 flex gap-2">
      <TextInput
        className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
        value={title}
        onChangeText={setTitle}
        placeholder="Title"
      />
      {error?.data?.zodError?.fieldErrors.title && (
        <Text className="mb-2 text-destructive">
          {error.data.zodError.fieldErrors.title}
        </Text>
      )}
      <TextInput
        className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
        value={content}
        onChangeText={setContent}
        placeholder="Content"
      />
      {error?.data?.zodError?.fieldErrors.content && (
        <Text className="mb-2 text-destructive">
          {error.data.zodError.fieldErrors.content}
        </Text>
      )}
      <Pressable
        className="flex items-center rounded bg-primary p-2"
        onPress={() => {
          mutate({
            title,
            content,
          });
        }}
      >
        <Text className="text-foreground">Create</Text>
      </Pressable>
      {error?.data?.code === "UNAUTHORIZED" && (
        <Text className="mt-2 text-destructive">
          You need to be logged in to create a post
        </Text>
      )}
    </View>
  );
}

function LoginForm() {
  const utils = api.useUtils();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate: signIn, error } = api.auth.signIn.useMutation({
    async onSuccess({ token }) {
      setToken(token);
      setEmail("");
      setPassword("");

      await utils.invalidate();
      router.replace("/");
    },
  });

  return (
    <View className="mt-4 flex gap-2">
      <TextInput
        className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
      />
      {error?.data?.zodError?.fieldErrors.email && (
        <Text className="mb-2 text-destructive">
          {error.data.zodError.fieldErrors.email}
        </Text>
      )}
      <TextInput
        className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
        value={password}
        onChangeText={setPassword}
        placeholder="Content"
      />
      {error?.data?.zodError?.fieldErrors.password && (
        <Text className="mb-2 text-destructive">
          {error.data.zodError.fieldErrors.password}
        </Text>
      )}
      <Pressable
        className="flex items-center rounded bg-primary p-2"
        onPress={() => {
          signIn({
            email,
            password,
          });
        }}
      >
        <Text className="text-foreground">Login</Text>
      </Pressable>
      {error?.data?.code === "UNAUTHORIZED" && (
        <Text className="mt-2 text-destructive">
          Incorrect login credentials
        </Text>
      )}
    </View>
  );
}

function MobileAuth() {
  const user = useUser();
  const signOut = useSignOut();

  return (
    <>
      <Text className="pb-2 text-center text-xl font-semibold text-white">
        {user?.id ?? "Not logged in"}
      </Text>
      {!user?.id ? (
        <LoginForm />
      ) : (
        <Button onPress={signOut} title="SignOut" color={"#5B65E9"} />
      )}
    </>
  );
}

export default function Index() {
  const utils = api.useUtils();

  const postQuery = api.post.all.useQuery();
  const { data: permissions } = api.auth.getUserPermissions.useQuery();

  const deletePostMutation = api.post.delete.useMutation({
    onSettled: () => utils.post.all.invalidate(),
  });

  return (
    <SafeAreaView className="bg-background">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: "Home Page" }} />
      <View className="h-full w-full bg-background p-4">
        <Text className="pb-2 text-center text-5xl font-bold text-foreground">
          Create <Text className="text-primary">T3</Text> Turbo
        </Text>

        <MobileAuth />

        {!!postQuery.data?.docs.length && (
          <View className="py-2">
            <Text className="mb-2 font-semibold italic text-primary">
              Press on a post
            </Text>
            <FlatList
              data={postQuery.data.docs}
              ItemSeparatorComponent={() => <View className="h-2" />}
              renderItem={({ item }) => (
                <PostCard
                  key={item.id}
                  post={item}
                  onDelete={() => deletePostMutation.mutate(item.id)}
                />
              )}
            />
          </View>
        )}
        {permissions?.collections.posts?.create.permission && <CreatePost />}
      </View>
    </SafeAreaView>
  );
}
