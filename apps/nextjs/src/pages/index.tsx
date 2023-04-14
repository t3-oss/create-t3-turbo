import { useState } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

import { api, type RouterOutputs } from "~/utils/api";

function PostCard(props: {
  post: RouterOutputs["post"]["all"][number];
  onPostDelete?: () => void;
}) {
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
        <span
          className="cursor-pointer text-sm font-bold uppercase text-emerald-400"
          onClick={props.onPostDelete}
        >
          Delete
        </span>
      </div>
    </div>
  );
}

function CreatePostForm() {
  const utils = api.useContext();

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
    <div className="flex w-full max-w-2xl flex-col p-4">
      <input
        className="mb-2 rounded bg-white/10 p-2 text-zinc-200"
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
        className="mb-2 rounded bg-white/10 p-2 text-zinc-200"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content"
      />
      {error?.data?.zodError?.fieldErrors.content && (
        <span className="mb-2 text-red-500">
          {error.data.zodError.fieldErrors.content}
        </span>
      )}
      <button
        className="rounded bg-emerald-400 p-2 font-bold text-zinc-900"
        onClick={() => {
          mutate({
            title,
            content,
          });
        }}
      >
        Create
      </button>
      {error?.data?.code === "UNAUTHORIZED" && (
        <span className="mt-2 text-red-500">
          You must be signed in to post.
        </span>
      )}
    </div>
  );
}

export default function HomePage() {
  const postQuery = api.post.all.useQuery();

  const deletePostMutation = api.post.delete.useMutation({
    onSettled: () => postQuery.refetch(),
  });

  return (
    <>
      <Head>
        <title>T3 Turbo x Supabase</title>
        <meta name="description" content="T3 Turbo x Supabase" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen flex-col items-center bg-zinc-900 text-zinc-200">
        <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            <span className="text-fuchsia-500">T3</span> Turbo x{" "}
            <span className="text-emerald-400">Supabase</span>
          </h1>
          <AuthShowcase />

          <CreatePostForm />

          {postQuery.data ? (
            <div className="w-full max-w-2xl">
              {postQuery.data?.length === 0 ? (
                <span>There are no posts!</span>
              ) : (
                <div className="flex h-[40vh] justify-center overflow-y-scroll px-4 text-2xl">
                  <div className="flex w-full flex-col gap-4">
                    {postQuery.data?.map((p) => {
                      return (
                        <PostCard
                          key={p.id}
                          post={p}
                          onPostDelete={() => deletePostMutation.mutate(p.id)}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </main>
    </>
  );
}

function AuthShowcase() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const { data: secretMessage } = api.auth.getSecretMessage.useQuery(
    undefined, // no input
    { enabled: !!user },
  );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {!user && (
        <Link
          className="flex items-center gap-1 rounded-lg bg-white/10 px-10 py-3 font-semibold text-zinc-200 no-underline transition hover:bg-white/20"
          href="/signin"
        >
          Sign In
        </Link>
      )}
      {user && (
        <>
          <p className="text-center text-2xl text-zinc-200">
            {user && <span>Logged in as {user?.user_metadata?.name}</span>}
            {secretMessage && <span> - {secretMessage}</span>}
          </p>
          <button
            className="rounded-lg bg-white/10 px-10 py-3 font-semibold text-zinc-200 no-underline transition hover:bg-white/20"
            onClick={() => void supabase.auth.signOut()}
          >
            Sign Out
          </button>
        </>
      )}
    </div>
  );
}
