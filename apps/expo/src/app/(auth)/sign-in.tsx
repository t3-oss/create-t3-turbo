import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link } from "expo-router";

import { useTranslationsNative } from "@gmacko/i18n/native";

import { authClient } from "~/utils/auth";

export default function SignInScreen() {
  const t = useTranslationsNative();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) return;
    setError("");
    setIsLoading(true);

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message ?? "Invalid email or password.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setIsLoading(false);
  }

  async function handleSocialSignIn(provider: "discord" | "google" | "github") {
    setError("");
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch {
      setError(`Failed to sign in with ${provider}.`);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-8 items-center">
          <View className="bg-primary mb-4 h-16 w-16 items-center justify-center rounded-2xl">
            <Text className="text-primary-foreground text-2xl font-bold">G</Text>
          </View>
          <Text className="text-foreground text-2xl font-bold">
            {t("auth.signIn")}
          </Text>
          <Text className="text-muted-foreground mt-1 text-sm">
            Sign in to your account to continue
          </Text>
        </View>

        {/* Email / Password form */}
        <View className="gap-3">
          <View>
            <Text className="text-foreground mb-1 text-sm font-medium">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              className="border-border bg-background text-foreground rounded-lg border px-4 py-3"
              placeholderTextColor="#A1A1AA"
            />
          </View>

          <View>
            <View className="mb-1 flex-row items-center justify-between">
              <Text className="text-foreground text-sm font-medium">
                Password
              </Text>
              <Link href="/(auth)/forgot-password" asChild>
                <Pressable>
                  <Text className="text-primary text-xs">Forgot password?</Text>
                </Pressable>
              </Link>
            </View>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              secureTextEntry
              textContentType="password"
              className="border-border bg-background text-foreground rounded-lg border px-4 py-3"
              placeholderTextColor="#A1A1AA"
            />
          </View>

          {error ? (
            <Text className="text-destructive text-sm">{error}</Text>
          ) : null}

          <Pressable
            onPress={handleSignIn}
            disabled={isLoading}
            className="bg-primary mt-1 items-center rounded-lg py-3.5"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            <Text className="text-primary-foreground font-semibold">
              {isLoading ? "Signing in..." : "Sign in"}
            </Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View className="my-6 flex-row items-center">
          <View className="bg-border h-px flex-1" />
          <Text className="text-muted-foreground mx-4 text-xs">
            OR CONTINUE WITH
          </Text>
          <View className="bg-border h-px flex-1" />
        </View>

        {/* Social sign-in */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => handleSocialSignIn("discord")}
            className="border-border bg-background flex-1 items-center rounded-lg border py-3"
          >
            <Text className="text-foreground font-medium">Discord</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSocialSignIn("google")}
            className="border-border bg-background flex-1 items-center rounded-lg border py-3"
          >
            <Text className="text-foreground font-medium">Google</Text>
          </Pressable>
          <Pressable
            onPress={() => handleSocialSignIn("github")}
            className="border-border bg-background flex-1 items-center rounded-lg border py-3"
          >
            <Text className="text-foreground font-medium">GitHub</Text>
          </Pressable>
        </View>

        {/* Sign up link */}
        <View className="mt-8 flex-row items-center justify-center">
          <Text className="text-muted-foreground text-sm">
            Don&apos;t have an account?{" "}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Text className="text-primary text-sm font-semibold">
                Sign up
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
