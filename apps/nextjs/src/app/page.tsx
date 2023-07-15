import { Suspense } from "react";

import { AuthShowcase } from "./auth-showcase";
import { CreatePostForm, PostList } from "./posts";

export default function HomePage() {
  return (
    <main className="flex h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-pink-400">T3</span> Turbo
        </h1>
        <AuthShowcase />

        <CreatePostForm />
        <Suspense fallback={<span>Loading...</span>}>
          <PostList />
        </Suspense>
      </div>
    </main>
  );
}
