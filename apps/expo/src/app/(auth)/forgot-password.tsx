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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) return;
    setIsLoading(true);

    try {
      await authClient.forgetPassword({
        email,
        redirectTo: "/reset-password",
      });
    } catch {
      // Intentionally swallow — don't reveal if email exists
    }

    setSubmitted(true);
    setIsLoading(false);
  }

  if (submitted) {
    return (
      <View className="bg-background flex-1 items-center justify-center px-6">
        <View className="bg-primary/10 mb-4 h-16 w-16 items-center justify-center rounded-full">
          <Text className="text-primary text-2xl">✉</Text>
        </View>
        <Text className="text-foreground text-xl font-bold">
          Check your email
        </Text>
        <Text className="text-muted-foreground mt-2 text-center text-sm">
          If an account exists for{" "}
          <Text className="font-semibold">{email}</Text>, we sent a password
          reset link.
        </Text>
        <Link href="/(auth)/sign-in" asChild>
          <Pressable className="border-border mt-6 rounded-lg border px-6 py-3">
            <Text className="text-foreground font-medium">Back to sign in</Text>
          </Pressable>
        </Link>
      </View>
    );
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
          <Text className="text-foreground text-2xl font-bold">
            Forgot password?
          </Text>
          <Text className="text-muted-foreground mt-1 text-center text-sm">
            Enter your email and we&apos;ll send you a reset link
          </Text>
        </View>

        {/* Form */}
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

          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            className="bg-primary items-center rounded-lg py-3.5"
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            <Text className="text-primary-foreground font-semibold">
              {isLoading ? "Sending..." : "Send reset link"}
            </Text>
          </Pressable>
        </View>

        {/* Back to sign in */}
        <View className="mt-8 flex-row items-center justify-center">
          <Text className="text-muted-foreground text-sm">
            Remember your password?{" "}
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
