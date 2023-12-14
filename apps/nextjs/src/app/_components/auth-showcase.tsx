import { cookies } from "next/headers";
import Link from "next/link";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import { signOut } from "../auth/actions";

export async function AuthShowcase() {
  const supabase = createServerComponentClient({ cookies });
  const user = await supabase.auth.getUser();

  if (!user.data.user) {
    return (
      <Link
        className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
        href="/auth/login"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {user.data.user && <span>Logged in as {user.data.user.email}</span>}
      </p>

      <form action={signOut}>
        <button className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20">
          Sign out
        </button>
      </form>
    </div>
  );
}
