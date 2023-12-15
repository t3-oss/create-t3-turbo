"use client";

import { useState } from "react";
import Image from "next/image";

import type { RouterOutputs } from "@acme/api";

import { api } from "~/trpc/react";

export function CreatePostForm() {
  const utils = api.useUtils();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { mutateAsync: createPost, error } = api.post.create.useMutation({
    async onSuccess() {
      setTitle("");
      setContent("");
      await utils.post.all.invalidate();
    },
  });

  return (
    <form
      className="flex w-full max-w-2xl flex-col"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await createPost({
            title,
            content,
          });
          setTitle("");
          setContent("");
          await utils.post.all.invalidate();
        } catch {
          // noop
        }
      }}
    >
      <input
        className="mb-2 rounded bg-white/10 p-2 text-white"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />
      {error?.data?.zodError?.fieldErrors.title && (
        <span className="mb-2 text-red-500">
          {error.data.zodError.fieldErrors.title}
        </span>
      )}
      <input
        className="mb-2 rounded bg-white/10 p-2 text-white"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
      />
      {error?.data?.zodError?.fieldErrors.content && (
        <span className="mb-2 text-red-500">
          {error.data.zodError.fieldErrors.content}
        </span>
      )}
      {}
      <button
        type="submit"
        className="rounded bg-emerald-400 p-2 font-bold text-zinc-900"
      >
        Create
      </button>
      {error?.data?.code === "UNAUTHORIZED" && (
        <span className="mt-2 text-red-500">You must be logged in to post</span>
      )}
    </form>
  );
}

export function PostList() {
  const [posts] = api.post.all.useSuspenseQuery();

  if (posts.length === 0) {
    return (
      <div className="relative flex w-full flex-col gap-4">
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />
        <PostCardSkeleton pulse={false} />

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <p className="text-2xl font-bold text-white">No posts yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {posts.map((p) => {
        return <PostCard key={p.id} post={p} />;
      })}
    </div>
  );
}

export function PostCard(props: {
  post: RouterOutputs["post"]["all"][number];
}) {
  const utils = api.useUtils();
  const deletePost = api.post.delete.useMutation();
  const { post } = props;

  return (
    <div className="flex flex-row rounded-lg bg-white/10 p-4 transition-all hover:scale-[101%]">
      <Image
        className="mr-2 self-center rounded"
        src={post.author?.image ?? ""}
        alt={`${post.author?.name}'s avatar`}
        width={64}
        height={64}
      />
      <div className="flex-grow">
        <h2 className="text-2xl font-bold text-emerald-400">{post.title}</h2>
        <p className="mt-2 text-sm">{post.content}</p>
      </div>
      <div>
        <button
          className="cursor-pointer text-sm font-bold uppercase text-emerald-400"
          onClick={async () => {
            await deletePost.mutateAsync(props.post.id);
            await utils.post.all.invalidate();
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function PostCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props;

  return (
    <div className="flex flex-row rounded-lg bg-white/10 p-4 transition-all hover:scale-[101%]">
      <div
        className={`mr-2 h-16 w-16 self-center rounded ${
          pulse && "animate-pulse"
        }`}
      />
      <div className="flex-grow">
        <h2
          className={`w-1/4 rounded bg-emerald-400 text-2xl font-bold ${
            pulse && "animate-pulse"
          }`}
        >
          &nbsp;
        </h2>
        <p
          className={`mt-2 w-1/3 rounded bg-current text-sm ${
            pulse && "animate-pulse"
          }`}
        >
          &nbsp;
        </p>
      </div>
    </div>
  );
}
