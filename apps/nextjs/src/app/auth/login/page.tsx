"use client";

import { useRouter } from "next/navigation";
import { Github } from "lucide-react";

import { signInWithGithub, signInWithPassword, signUp } from "../actions";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="flex h-screen items-center bg-zinc-900 text-zinc-200">
      <div className="mx-auto flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Sign In</h1>
        <form className="flex w-full flex-col gap-2">
          <input
            className="rounded-lg bg-white/10 px-4 py-1 text-zinc-200 transition hover:bg-white/20"
            type="email"
            name="email"
            placeholder="Email"
          />
          <input
            className="w-full rounded-lg bg-white/10 px-4 py-1 text-zinc-200 transition hover:bg-white/20"
            type="password"
            name="password"
            placeholder="Password"
          />

          <button
            className="w-full rounded-lg bg-emerald-400 py-2 font-semibold text-zinc-900 no-underline transition hover:bg-emerald-500"
            formAction={async (formData) => {
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;

              const res = await signInWithPassword(email, password);
              console.log("Sign in response", res);
              router.push("/");
            }}
          >
            Sign in
          </button>
          <button
            formAction={async (formData) => {
              const email = formData.get("email") as string;
              const password = formData.get("password") as string;

              await signUp(email, password);
              alert("Check your email for a confirmation link.");
            }}
          >
            {`Don't have an account? Sign up.`}
          </button>
        </form>

        <div className="relative flex w-full justify-center border-b border-zinc-200 py-2">
          <span className="absolute top-1 bg-zinc-900 px-2">or</span>
        </div>

        <button
          className="flex items-center gap-1 rounded-lg bg-white/10 px-10 py-2 font-semibold text-zinc-200 no-underline transition hover:bg-white/20"
          onClick={() => signInWithGithub()}
        >
          <Github size={20} />
          Continue with Github
        </button>
      </div>
    </main>
  );
}
