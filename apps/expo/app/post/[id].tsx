import { SafeAreaView, Text, View } from "react-native";
import { SplashScreen, Stack, usePathname } from "expo-router";

import { api } from "../../src/utils/api";

const About: React.FC = () => {
  const pathname = usePathname();
  const id = pathname.split("/")[2] as string;
  const { data } = api.post.byId.useQuery(id);

  if (!data) return <SplashScreen />;

  return (
    <SafeAreaView className="bg-[#2e026d]">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: "About" }} />
      <View className="h-full w-full p-4">
        <Text className="py-2 text-3xl font-bold text-white">
          {data?.title}
        </Text>
        <Text className="py-4 text-white">{data?.content}</Text>
      </View>
    </SafeAreaView>
  );
};

export default About;
