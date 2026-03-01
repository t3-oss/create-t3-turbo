"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";
import { Label } from "@gmacko/ui/label";
import { toast } from "@gmacko/ui/toast";

import { authClient } from "~/auth/client";

/**
 * Forgot password page — request a password reset email.
 *
 * Uses Better Auth's `authClient.forgetPassword()` API.
 * Shows a success message regardless of whether the email exists
 * (prevents email enumeration).
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      });
    } catch {
      // Intentionally swallow — don't reveal if email exists
    }

    // Always show success to prevent email enumeration
    setSubmitted(true);
    setIsLoading(false);
    toast.success("Check your email", {
      description: "If an account exists, we sent a reset link.",
    });
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          If an account exists for <strong>{email}</strong>, we sent a password
          reset link.
        </p>
        <Button variant="outline" className="mt-6" asChild>
          <Link href="/sign-in" prefetch>Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">Forgot password?</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Remember your password?{" "}
        <Link href="/sign-in" prefetch className="text-foreground font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
