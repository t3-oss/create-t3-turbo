import { type ReactNode } from "react";
import { Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Entypo, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useUser } from "@supabase/auth-helpers-react";

export function AuthAvatar() {
  const user = useUser();
  const router = useRouter();
  const profileImage = user?.user_metadata.avatar_url as string | undefined;

  return (
    <TouchableOpacity onPress={() => router.push("/profile")}>
      {user && profileImage && (
        <Image
          className="h-8 w-8 rounded-full"
          accessibilityLabel="User Avatar"
          source={{ uri: (user?.user_metadata.avatar_url as string) ?? null }}
        />
      )}
      {user && !profileImage && (
        <FontAwesome name="user" size={32} color="#E4E4E7" />
      )}
      {!user && <Entypo name="login" size={32} color="#E4E4E7" />}
    </TouchableOpacity>
  );
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
