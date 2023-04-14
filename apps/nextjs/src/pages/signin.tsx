import { useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Eye, EyeOff, Github } from "lucide-react";

export default function SigninPage() {
  const supabase = useSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const signInWithPassword = async () => {
    const { error, data } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
        })
      : await supabase.auth.signInWithPassword({
          email,
          password,
        });
    if (error) alert(error.message);
    else if (isSignUp && data.user) {
      alert("Check your email for a confirmation link.");
      setIsSignUp(false);
    }
  };

  const signInWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { scopes: "read:user user:email" },
    });
    if (error) alert(error.message);
  };

  return (
    <main className="flex h-screen bg-zinc-900 text-zinc-200">
      <div className="mx-auto flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl font-extrabold tracking-tight">Sign In</h1>
        <div className="flex w-full flex-col gap-2">
          <input
            className="rounded-lg bg-white/10 px-4 py-1 text-zinc-200 transition hover:bg-white/20"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <div className="relative">
            <input
              className="w-full rounded-lg bg-white/10 px-4 py-1 text-zinc-200 transition hover:bg-white/20"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
            <button
              className="absolute bottom-0 right-0 top-0 flex items-center justify-center px-2"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
          <button
            className="w-full rounded-lg bg-emerald-400 py-2 font-semibold text-zinc-900 no-underline transition hover:bg-emerald-500"
            onClick={signInWithPassword}
          >
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
          <button onClick={() => setIsSignUp((s) => !s)}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </button>
        </div>

        <div className="relative flex w-full justify-center border-b border-zinc-200 py-2">
          <span className="absolute top-1 bg-zinc-900 px-2">or</span>
        </div>

        <button
          className="flex items-center gap-1 rounded-lg bg-white/10 px-10 py-2 font-semibold text-zinc-200 no-underline transition hover:bg-white/20"
          onClick={signInWithGithub}
        >
          <Github size={20} />
          Continue with Github
        </button>
      </div>
    </main>
  );
}
