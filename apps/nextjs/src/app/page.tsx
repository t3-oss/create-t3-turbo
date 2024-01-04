import { Suspense } from "react";

import { api } from "~/trpc/server";
import { AuthShowcase } from "./_components/auth-showcase";
import {
  CreatePostForm,
  PostCardSkeleton,
  PostList,
} from "./_components/posts";

export const runtime = "edge";

export default async function HomePage() {
  // You don't need to fetch these here, just showing different usages
  // If you don't want the Suspense loading state, you could pass these
  // posts as props as use as initialData in the query.
  const posts = await api.post.all();
  console.log("RSC Posts:", posts);

  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-primary">T3</span> Turbo
        </h1>
        <AuthShowcase />

        <CreatePostForm />
        <div className="w-full max-w-2xl overflow-y-scroll">
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4">
                <PostCardSkeleton />
                <PostCardSkeleton />
                <PostCardSkeleton />
              </div>
            }
          >
            <PostList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
