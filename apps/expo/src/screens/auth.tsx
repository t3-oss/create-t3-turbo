import React from "react";
import { Text, View, SafeAreaView, TouchableOpacity } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
import * as AppleAuth from "expo-apple-authentication";
import { signIn } from "@acme/auth/src/expo/client";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSession } from "next-auth/expo";
import { nativeApple, socialLogin } from "../utils/auth";

export const AuthScreen = () => {
  const session = useSession();

  return (
    <SafeAreaView className="bg-[#2e026d] bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <View className="h-full w-full p-4">
        <Text className="mx-auto pb-2 text-5xl font-bold text-white">
          Create <Text className="text-[#cc66ff]">T3</Text> Turbo
        </Text>

        <View className="flex flex-col items-center gap-4 p-2">
          <Text className="mx-auto text-3xl font-bold text-white">
            Authenticate yourself!
          </Text>
          <AppleAuth.AppleAuthenticationButton
            buttonType={AppleAuth.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuth.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={5}
            className="h-12 w-full"
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={async () => {
              await signIn(nativeApple);
            }}
          />
          <TouchableOpacity
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={async () => {
              await signIn(() => socialLogin("github"));
            }}
            className="flex h-12 w-full flex-row items-center justify-center space-x-2 rounded-md bg-black text-white"
          >
            <FontAwesome5 name="github" size={16} color="white" />
            <Text className="text-lg font-semibold text-white">
              Sign In With GitHub
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress={async () => {
              await signIn(() => socialLogin("discord"));
            }}
            className="flex h-12 w-full flex-row items-center justify-center space-x-2 rounded-md bg-black text-white"
          >
            <FontAwesome5 name="discord" size={16} color="white" />
            <Text className="text-lg font-semibold text-white">
              Sign In With Discord
            </Text>
          </TouchableOpacity>
        </View>

        <View className="flex flex-col items-center gap-4 p-2">
          <Text className="mx-auto text-3xl font-bold text-white">
            {session.status === "authenticated"
              ? `Hello ${session.data.user.name ?? "Unknown"}!`
              : "Not Authenticated"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};
