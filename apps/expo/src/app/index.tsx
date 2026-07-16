import { useTranslationsNative } from "@gmacko/i18n/native";
import { LegendList } from "@legendapp/list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as AppleAuthentication from "expo-apple-authentication";
import { Link, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RouterOutputs } from "~/utils/api";
import { trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { deleteToken } from "~/utils/session-store";

function PostCard(props: {
  post: RouterOutputs["post"]["all"][number];
  onDelete: () => void;
}) {
  const t = useTranslationsNative();

  return (
    <View className="bg-muted flex flex-row rounded-lg p-4">
      <View className="grow">
        <Link
          asChild
          href={{
            pathname: "/post/[id]",
            params: { id: props.post.id },
          }}
        >
          <Pressable className="">
            <Text className="text-primary text-xl font-semibold">
              {props.post.title}
            </Text>
            <Text className="text-foreground mt-2">{props.post.content}</Text>
          </Pressable>
        </Link>
      </View>
      <Pressable onPress={props.onDelete}>
        <Text className="text-primary font-bold uppercase">
          {t("common.delete")}
        </Text>
      </Pressable>
    </View>
  );
}

function CreatePost() {
  const queryClient = useQueryClient();
  const t = useTranslationsNative();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { mutate, error } = useMutation(
    trpc.post.create.mutationOptions({
      async onSuccess() {
        setTitle("");
        setContent("");
        await queryClient.invalidateQueries(trpc.post.all.queryFilter());
      },
    }),
  );

  return (
    <View className="mt-4 flex gap-2">
      <TextInput
        className="border-input bg-background text-foreground items-center rounded-md border px-3 text-lg leading-tight"
        value={title}
        onChangeText={setTitle}
        placeholder={t("common.create") + " " + t("common.title")}
      />
      {error?.data?.zodError?.fieldErrors.title && (
        <Text className="text-destructive mb-2">
          {error.data.zodError.fieldErrors.title}
        </Text>
      )}
      <TextInput
        className="border-input bg-background text-foreground items-center rounded-md border px-3 text-lg leading-tight"
        value={content}
        onChangeText={setContent}
        placeholder={t("common.content")}
      />
      {error?.data?.zodError?.fieldErrors.content && (
        <Text className="text-destructive mb-2">
          {error.data.zodError.fieldErrors.content}
        </Text>
      )}
      <Pressable
        className="bg-primary flex items-center rounded-sm p-2"
        onPress={() => {
          mutate({
            title,
            content,
          });
        }}
      >
        <Text className="text-foreground">{t("common.create")}</Text>
      </Pressable>
      {error?.data?.code === "UNAUTHORIZED" && (
        <Text className="text-destructive mt-2">
          {t("errors.unauthorized")}
        </Text>
      )}
    </View>
  );
}

function MobileAuth() {
  const { data: session } = authClient.useSession();
  const t = useTranslationsNative();
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") {
      return;
    }

    void AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
  }, []);

  const handleAppleSignIn = async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error("Apple sign-in did not return an identity token.");
    }

    await authClient.signIn.social({
      provider: "apple",
      idToken: {
        token: credential.identityToken,
        accessToken: credential.authorizationCode ?? undefined,
      },
      callbackURL: "/",
    });
  };

  return (
    <>
      <Text className="text-foreground pb-2 text-center text-xl font-semibold">
        {session?.user.name
          ? `${t("common.welcome")}, ${session.user.name}`
          : t("auth.dontHaveAccount")}
      </Text>
      <Pressable
        onPress={async () => {
          if (session) {
            try {
              await authClient.signOut();
            } finally {
              // Always drop the device-paired bearer token, even when the
              // server-side revocation fails — a lingering token would keep
              // authenticating requests as the signed-out user.
              await deleteToken();
            }
            return;
          }
          await authClient.signIn.social({
            provider: "github",
            callbackURL: "/",
          });
        }}
        className="bg-primary flex items-center rounded-sm p-2"
      >
        <Text>
          {session ? t("auth.signOut") : t("auth.signIn") + " With GitHub"}
        </Text>
      </Pressable>
      {!session ? (
        <Link asChild href="/pair">
          <Pressable className="border-input mt-3 flex items-center rounded-sm border p-2">
            <Text className="text-foreground">Sign in with QR Code</Text>
          </Pressable>
        </Link>
      ) : null}
      {!session && appleAuthAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          onPress={() => {
            void handleAppleSignIn();
          }}
          style={{ height: 44, marginTop: 12, width: "100%" }}
        />
      ) : null}
    </>
  );
}

export default function Index() {
  const queryClient = useQueryClient();
  const t = useTranslationsNative();

  const postQuery = useQuery(trpc.post.all.queryOptions());

  const deletePostMutation = useMutation(
    trpc.post.delete.mutationOptions({
      onSettled: () =>
        queryClient.invalidateQueries(trpc.post.all.queryFilter()),
    }),
  );

  return (
    <SafeAreaView className="bg-background">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: t("nav.home") }} />
      <View className="bg-background h-full w-full p-4">
        <Text className="text-foreground pb-2 text-center text-5xl font-bold">
          Create <Text className="text-primary">T3</Text> Turbo
        </Text>

        <MobileAuth />

        <View className="py-2">
          <Text className="text-primary font-semibold italic">
            Press on a post
          </Text>
        </View>

        <LegendList
          data={postQuery.data ?? []}
          estimatedItemSize={20}
          keyExtractor={(item) => item.id}
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
    </SafeAreaView>
  );
}
