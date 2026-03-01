import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { LegendList } from "@legendapp/list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useTranslationsNative } from "@gmacko/i18n/native";

import type { RouterOutputs } from "~/utils/api";
import { EmptyState } from "~/components/empty-state";
import { LoadingSpinner } from "~/components/loading";
import { trpc } from "~/utils/api";

type Post = RouterOutputs["post"]["all"][number];

/**
 * Projects tab — list, create, and manage projects (posts).
 *
 * Features:
 * - Pull-to-refresh
 * - Virtualized list (LegendList)
 * - Slide to delete
 * - Create modal with title + content
 */
export default function ProjectsScreen() {
  const t = useTranslationsNative();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const {
    data: posts,
    isLoading,
    isRefreshing,
  } = useQuery(trpc.post.all.queryOptions());

  const deleteMutation = useMutation(
    trpc.post.delete.mutationOptions({
      onSettled: () =>
        queryClient.invalidateQueries(trpc.post.all.queryFilter()),
    }),
  );

  function handleDelete(post: Post) {
    Alert.alert("Delete Project", `Delete "${post.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteMutation.mutate(post.id),
      },
    ]);
  }

  const handleRefresh = () => {
    void queryClient.invalidateQueries(trpc.post.all.queryFilter());
  };

  return (
    <SafeAreaView className="bg-background flex-1" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <Text className="text-foreground text-2xl font-bold">Projects</Text>
        <Pressable
          onPress={() => setShowCreate(true)}
          className="bg-primary rounded-lg px-4 py-2"
        >
          <Text className="text-primary-foreground font-semibold">+ New</Text>
        </Pressable>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <LoadingSpinner size="large" />
        </View>
      ) : !posts || posts.length === 0 ? (
        <EmptyState
          icon={<Text className="text-muted-foreground text-2xl">&#128193;</Text>}
          title="No projects yet"
          description="Create your first project to get started."
          action={{
            label: "Create project",
            onPress: () => setShowCreate(true),
          }}
        />
      ) : (
        <LegendList
          data={posts}
          estimatedItemSize={90}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <ProjectCard
              post={item}
              onDelete={() => handleDelete(item)}
            />
          )}
        />
      )}

      {/* Create modal */}
      <CreateProjectModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </SafeAreaView>
  );
}

function ProjectCard({
  post,
  onDelete,
}: {
  post: Post;
  onDelete: () => void;
}) {
  return (
    <Link
      href={{ pathname: "/post/[id]", params: { id: post.id } }}
      asChild
    >
      <Pressable className="border-border bg-card rounded-xl border p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-foreground text-base font-semibold">
              {post.title}
            </Text>
            <Text
              className="text-muted-foreground mt-1 text-sm"
              numberOfLines={2}
            >
              {post.content}
            </Text>
            <Text className="text-muted-foreground mt-2 text-xs">
              Created {new Date(post.createdAt).toLocaleDateString()}
            </Text>
          </View>
          <Pressable
            onPress={onDelete}
            hitSlop={8}
            className="rounded-md p-2"
          >
            <Text className="text-destructive text-xs font-bold">DELETE</Text>
          </Pressable>
        </View>
      </Pressable>
    </Link>
  );
}

function CreateProjectModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { mutate, isPending, error } = useMutation(
    trpc.post.create.mutationOptions({
      async onSuccess() {
        setTitle("");
        setContent("");
        await queryClient.invalidateQueries(trpc.post.all.queryFilter());
        onClose();
      },
    }),
  );

  function handleCreate() {
    if (!title.trim() || !content.trim()) return;
    mutate({ title: title.trim(), content: content.trim() });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="bg-background flex-1">
        {/* Modal header */}
        <View className="flex-row items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <Pressable onPress={onClose}>
            <Text className="text-primary font-medium">Cancel</Text>
          </Pressable>
          <Text className="text-foreground text-lg font-semibold">
            New Project
          </Text>
          <Pressable
            onPress={handleCreate}
            disabled={isPending || !title.trim() || !content.trim()}
            style={{ opacity: isPending ? 0.5 : 1 }}
          >
            <Text className="text-primary font-semibold">
              {isPending ? "..." : "Create"}
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <View className="gap-4 p-6">
          <View>
            <Text className="text-foreground mb-1 text-sm font-medium">
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Project name"
              autoFocus
              className="border-border bg-background text-foreground rounded-lg border px-4 py-3"
              placeholderTextColor="#A1A1AA"
            />
            {error?.data?.zodError?.fieldErrors.title && (
              <Text className="text-destructive mt-1 text-xs">
                {error.data.zodError.fieldErrors.title}
              </Text>
            )}
          </View>

          <View>
            <Text className="text-foreground mb-1 text-sm font-medium">
              Description
            </Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="What is this project about?"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="border-border bg-background text-foreground min-h-[120px] rounded-lg border px-4 py-3"
              placeholderTextColor="#A1A1AA"
            />
            {error?.data?.zodError?.fieldErrors.content && (
              <Text className="text-destructive mt-1 text-xs">
                {error.data.zodError.fieldErrors.content}
              </Text>
            )}
          </View>

          {error && !error.data?.zodError && (
            <Text className="text-destructive text-sm">
              {error.message ?? "Failed to create project."}
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
