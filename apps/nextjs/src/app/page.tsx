import { Suspense } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@acme/auth";

import { api } from "~/utils/api";
import { CreatePostForm } from "./post-form";
import { SubmitButton, buttonClasses } from "./submit-button";

export const metadata = {
  title: {
    default: "Create T3 Turbo",
    template: "%s - Create T3 Turbo",
  },
  description: "Monorepo template for the T3 Stack",
};

export default function HomePage() {
  return (
    <main className="flex h-screen flex-col items-center">
      <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
        <h1 className="bg-gradient-to-r from-indigo-700 to-fuchsia-500 bg-clip-text text-center text-5xl/[3rem] font-bold text-transparent md:text-7xl/[5rem]">
          Create T3 Turbo
        </h1>
        <AuthShowcase />

        <CreatePostForm
          action={async (fd) => {
            "use server";
            const title = fd.get("title") as string;
            const content = fd.get("content") as string;

            await api.post.create
              .mutate({ title, content })
              .catch((e) => console.log("error", e));
            api.post.all.revalidate();
          }}
        />

        <Suspense fallback={<div>Loading...</div>}>
          <PostList />
        </Suspense>
      </div>
    </main>
  );
}

async function PostList() {
  const posts = await api.post.all.query();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      {posts.map((p) => {
        return (
          <div
            key={p.id}
            className="flex flex-row rounded-lg bg-white/10 p-4 transition-all hover:scale-[101%]"
          >
            <div className="flex-grow">
              <h2 className="text-2xl font-bold text-muted-foreground">
                {p.title}
              </h2>
              <p className="mt-2 text-sm">{p.content}</p>
            </div>
            <form
              action={async () => {
                "use server";
                await api.post.delete.mutate(p.id);
                api.post.all.revalidate();
              }}
            >
              <SubmitButton type="submit">Delete</SubmitButton>
            </form>
          </div>
        );
      })}
    </div>
  );
}

async function AuthShowcase() {
  const session = await getServerSession(authOptions);

  // const secretMessage =
  //   session?.user && (await api.example.getSecretMessage.query());

  return (
    <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        {session && <span>Logged in as {session.user?.name}</span>}
        {/* {secretMessage && <span> - {secretMessage}</span>} */}
      </p>
      <Link
        href={session ? "/api/auth/signout" : "/api/auth/signin"}
        className={buttonClasses}
      >
        {session ? "Sign out" : "Sign in"}
      </Link>
    </div>
  );
}
