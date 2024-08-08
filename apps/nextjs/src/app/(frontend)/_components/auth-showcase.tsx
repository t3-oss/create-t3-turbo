"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { api } from "@acme/api/provider";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

import { useSignOut, useUser } from "~/utils/auth";
import { setToken } from "~/utils/token";

function LoginForm() {
  const utils = api.useUtils();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate: signIn, error } = api.auth.signIn.useMutation({
    async onSuccess({ token }) {
      setToken(token);
      setEmail("");
      setPassword("");

      await utils.invalidate();
      router.replace("/");
    },
  });

  return (
    <form
      className="mt-4 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        signIn({
          email,
          password,
        });
      }}
    >
      <Input
        className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      {error?.data?.zodError?.fieldErrors.email && (
        <p className="mb-2 text-destructive">
          {error.data.zodError.fieldErrors.email}
        </p>
      )}
      <Input
        className="items-center rounded-md border border-input bg-background px-3 text-lg leading-[1.25] text-foreground"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="password"
      />
      {error?.data?.zodError?.fieldErrors.password && (
        <p className="mb-2 text-destructive">
          {error.data.zodError.fieldErrors.password}
        </p>
      )}
      <Button className="flex items-center rounded bg-primary p-2">
        <span className="text-foreground">Login</span>
      </Button>
      {error?.data?.code === "UNAUTHORIZED" && (
        <p className="mt-2 text-destructive">Incorrect login credentials</p>
      )}
    </form>
  );
}

export function AuthShowcase() {
  const user = useUser();
  const signOut = useSignOut();
  return (
    <>
      <div className="pb-2 text-center text-2xl">
        {user?.email ? "Logged in as " + user.email : "Not logged in"}
      </div>
      {!user?.id ? (
        <LoginForm />
      ) : (
        <form onSubmit={signOut}>
          <Button size="lg">Sign out</Button>
        </form>
      )}
    </>
  );
}
