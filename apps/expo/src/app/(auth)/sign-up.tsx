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

import { authClient } from "~/utils/auth";

export default function SignUpScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password.trim()) return;

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message ?? "Could not create account.");
      }
      // On success, the auth guard in _layout.tsx will redirect to (tabs)
    } catch {
      setError("Something went wrong. Please try again.");
    }

    setIsLoading(false);
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
            Create account
          </Text>
          <Text className="text-muted-foreground mt-1 text-sm">
            Get started with your free account
          </Text>
        </View>

        {/* Form */}
        <View className="gap-3">
          <View>
            <Text className="text-foreground mb-1 text-sm font-medium">
              Full name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              autoCapitalize="words"
              textContentType="name"
              className="border-border bg-background text-foreground rounded-lg border px-4 py-3"
              placeholderTextColor="#A1A1AA"
            />
          </View>

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
            <Text className="text-foreground mb-1 text-sm font-medium">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry
              textContentType="newPassword"
              className="border-border bg-background text-foreground rounded-lg border px-4 py-3"
              placeholderTextColor="#A1A1AA"
            />
          </View>

          {error ? (
            <Text className="text-destructive text-sm">{error}</Text>
          ) : null}

          <Pressable
            onPress={handleSignUp}
            disabled={isLoading}
            className="bg-primary mt-1 items-center rounded-lg py-3.5"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            <Text className="text-primary-foreground font-semibold">
              {isLoading ? "Creating account..." : "Create account"}
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

        {/* Social sign-up */}
        <View className="flex-row gap-3">
          <Pressable
            onPress={() =>
              authClient.signIn.social({
                provider: "discord",
                callbackURL: "/",
              })
            }
            className="border-border bg-background flex-1 items-center rounded-lg border py-3"
          >
            <Text className="text-foreground font-medium">Discord</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              authClient.signIn.social({
                provider: "google",
                callbackURL: "/",
              })
            }
            className="border-border bg-background flex-1 items-center rounded-lg border py-3"
          >
            <Text className="text-foreground font-medium">Google</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              authClient.signIn.social({
                provider: "github",
                callbackURL: "/",
              })
            }
            className="border-border bg-background flex-1 items-center rounded-lg border py-3"
          >
            <Text className="text-foreground font-medium">GitHub</Text>
          </Pressable>
        </View>

        {/* Sign in link */}
        <View className="mt-8 flex-row items-center justify-center">
          <Text className="text-muted-foreground text-sm">
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <Text className="text-primary text-sm font-semibold">
                Sign in
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
