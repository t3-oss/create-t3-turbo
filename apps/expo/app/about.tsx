import { SafeAreaView, Text, View } from "react-native";
import { Link, Stack } from "expo-router";

const About: React.FC = () => {
  return (
    <SafeAreaView className="bg-[#2e026d] bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      {/* Changes page title visible on the header */}
      <Stack.Screen options={{ title: "About" }} />
      <View className="h-full w-full p-4">
        <Text className="py-2 text-3xl font-bold text-white">
          About Create T3 Turbo
        </Text>
        <Text className="py-4 text-white">
          Clean and simple starter repo using the T3 Stack along with Expo React
          Native
        </Text>
        <View className="mt-4 border-t border-pink-400">
          <Link href="https://github.com/t3-oss/create-t3-turbo">
            <Text className="text-pink-400">View on GitHub</Text>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default About;
