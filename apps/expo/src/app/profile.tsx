import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { AntDesign } from "@expo/vector-icons";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";

import { initiateAppleSignIn } from "../utils/auth";

export default function Profile() {
  const user = useUser();
  return (
    <View className="flex-1 bg-zinc-800 p-4">
      {user ? <SignedInView /> : <SignedOutView />}
    </View>
  );
}

function SignedInView() {
  const supabase = useSupabaseClient();
  const user = useUser();

  return (
    <View className="flex gap-4">
      <Text className="text-zinc-200">Signed in as {user?.email}</Text>
      <Pressable
        onPress={() => supabase.auth.signOut()}
        className="flex-row items-center justify-center gap-2 rounded-lg bg-zinc-200 p-2"
      >
        <Text className="text-xl font-semibold text-zinc-900">Sign out</Text>
      </Pressable>
    </View>
  );
}

function SignedOutView() {
  const supabase = useSupabaseClient();

  const signInWithApple = async () => {
    try {
      const { token, nonce } = await initiateAppleSignIn();
      const { error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token,
        nonce,
      });
      if (error) return Alert.alert("Error", error.message);
    } catch (e) {
      if (typeof e === "object" && !!e && "code" in e) {
        if (e.code === "ERR_REQUEST_CANCELED") {
          // handle that the user canceled the sign-in flow
        } else {
          // handle other errors
        }
      } else {
        console.error("Unexpected error from Apple SignIn: ", e);
      }
    }
  };

  return (
    <View className="space-y-4">
      <Text className="mb-4 text-2xl font-bold text-zinc-200">Sign In</Text>

      {/* Email Sign In */}
      <EmailForm />

      <View className="relative mb-2 flex-row items-center justify-center border-b border-zinc-200 py-2">
        <Text className="absolute top-1/2 bg-zinc-800 px-2 text-lg text-zinc-200">
          or
        </Text>
      </View>

      {/* Sign in with Apple */}
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={8}
        onPress={signInWithApple}
        style={{ height: 40 }}
      />
    </View>
  );
}

function EmailForm() {
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
    if (error) Alert.alert("Error", error.message);
    else if (isSignUp && data.user) {
      Alert.alert("Check your email for a confirmation link.");
      setIsSignUp(false);
    }
  };

  return (
    <View className="flex-col gap-4">
      <TextInput
        className="rounded bg-white/10 p-2 text-zinc-200"
        placeholderTextColor="#A1A1A9" // zinc-400
        value={email}
        autoCapitalize="none"
        onChangeText={setEmail}
        placeholder="Email"
      />
      <View className="relative space-y-1">
        <TextInput
          className="rounded bg-white/10 p-2 text-zinc-200"
          placeholderTextColor="#A1A1A9" // zinc-400
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          placeholder="Password"
        />
        <Pressable
          className="absolute right-2"
          onPress={() => setShowPassword((prev) => !prev)}
        >
          {showPassword && <AntDesign name="eye" size={24} color="#A1A1A9" />}
          {!showPassword && <AntDesign name="eyeo" size={24} color="#A1A1A9" />}
        </Pressable>
      </View>

      <Pressable className="h-4" onPress={() => setIsSignUp((prev) => !prev)}>
        <Text className="flex-1 text-zinc-200">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
        </Text>
      </Pressable>

      <Pressable
        onPress={signInWithPassword}
        className="flex-row items-center justify-center rounded-lg bg-emerald-400 p-2"
      >
        <Text className="ml-1 text-xl font-medium">
          {isSignUp ? "Sign Up" : "Sign In"}
        </Text>
      </Pressable>
    </View>
  );
}
