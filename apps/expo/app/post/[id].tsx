import { SafeAreaView, Text, View } from "react-native";
import { SplashScreen, Stack, useSearchParams } from "expo-router";

import { api } from "../../src/utils/api";

const Post: React.FC = () => {
  const { id } = useSearchParams();
  const { data } = api.post.byId.useQuery(id || "", { enabled: !!id });

  if (!data) return <SplashScreen />;

  return (
    <SafeAreaView className="bg-[#1F104A]">
      <Stack.Screen
        options={{ title: !data.title ? "Untitled" : data.title }}
      />
      <View className="h-full w-full p-4">
        <Text
          className={`py-2 text-3xl font-bold text-white ${
            !data.content ? "italic" : ""
          }`}
        >
          {data.title || "Untitled"}
        </Text>
        <Text className={`py-4 text-white ${!data.content ? "italic" : ""}`}>
          {data.content || "No content"}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Post;
