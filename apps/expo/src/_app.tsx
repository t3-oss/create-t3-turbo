import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

const App = () => {
  return (
    <View className="flex flex-1 bg-white items-center justify-center">
      <Text className="font-bold text-blue-800">
        Open up App.tsx to start working on your app!
      </Text>
      <StatusBar style="auto" />
    </View>
  );
};

registerRootComponent(App);
