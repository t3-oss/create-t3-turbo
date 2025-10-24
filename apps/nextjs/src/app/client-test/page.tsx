"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { authClient as client } from "~/auth/client";

export default function ClientTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, startTransition] = useTransition();

  // Get the session data using the useSession hook
  const { data: session, isPending, error } = client.useSession();

  const handleLogin = () => {
    startTransition(async () => {
      await client.signIn.email(
        {
          email,
          password,
          callbackURL: "/client-test",
        },
        {
          onError: (ctx) => {
            toast.error(ctx.error.message);
          },
          onSuccess: () => {
            toast.success("Successfully logged in!");
            setEmail("");
            setPassword("");
          },
        },
      );
    });
  };

  return (
    <div className="container mx-auto space-y-8 py-10">
      <h1 className="text-center text-2xl font-bold">
        Client Authentication Test
      </h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Session Display */}
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>
              {isPending
                ? "Loading session..."
                : session
                  ? "You are currently logged in"
                  : "You are not logged in"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <div className="flex justify-center py-4">
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="bg-destructive/10 text-destructive rounded-md p-4">
                Error: {error.message}
              </div>
            ) : session ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                      <span className="text-lg font-medium">
                        {session.user.name.charAt(0) ||
                          session.user.email.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{session.user.name}</p>
                    <p className="text-muted-foreground text-sm">
                      {session.user.email}
                    </p>
                  </div>
                </div>

                <div className="bg-muted rounded-md p-4">
                  <p className="mb-2 text-sm font-medium">Session Details:</p>
                  <pre className="max-h-40 overflow-auto text-xs">
                    {JSON.stringify(session, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground py-8 text-center">
                <p>Sign in to view your session information</p>
              </div>
            )}
          </CardContent>
          {session && (
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  client.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        toast.success("Successfully signed out!");
                      },
                    },
                  })
                }
              >
                Sign Out
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
