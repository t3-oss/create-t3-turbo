import type { ReactNode } from "react";
import { Button, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export function AuthAvatar() {
  // const user = useUser();
  const router = useRouter();
  // const profileImage = user?.user_metadata.avatar_url as string | undefined;

  return <Button title="Sign In" onPress={() => router.push("/profile")} />;

  /**
   * FIXME: Something is wrong when rendering anything but a Button here...
   */

  // return (
  //   <TouchableOpacity onPress={() => router.push("/profile")}>
  //     {user && profileImage && (
  //       <Image
  //         className="h-8 w-8 rounded-full"
  //         accessibilityLabel="User Avatar"
  //         source={{ uri: profileImage ?? null }}
  //       />
  //     )}
  //     {user && !profileImage && (
  //       <FontAwesome name="user" size={24} color="#E4E4E7" />
  //     )}
  //     {!user && <Entypo name="login" size={24} color="#E4E4E7" />}
  //   </TouchableOpacity>
  // );
}

export function HeaderBackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()}>
      <Ionicons name="arrow-back" size={32} color="#E4E4E7" />
    </TouchableOpacity>
  );
}

export function HeaderTitle(props: { children: ReactNode }) {
  return (
    <Text className="text-3xl font-semibold text-zinc-200">
      {props.children}
    </Text>
  );
}
