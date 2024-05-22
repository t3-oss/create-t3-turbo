import { api } from "~/trpc/server";
import { AuthShowcase } from "./_components/auth-showcase";
import {
  CreatePostForm,
  PostList,
} from "./_components/posts";
import superjson from 'superjson';

export default async function HomePage() {
  const posts = await api.post.all();

  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-primary">T3</span> Turbo{" "}
          <span className="text-green-500">MongoDB</span>
        </h1>
        <AuthShowcase />

        <CreatePostForm />
        <div className="w-full max-w-2xl overflow-y-scroll">
          {/* use superjson to get posts data over the use client boundary */}
          {/* TODO: work out how to use Suspense with superjson */}
          <PostList posts={superjson.stringify(posts)} />
        </div>
      </div>
    </main>
  );
}
