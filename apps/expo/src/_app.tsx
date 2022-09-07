import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TRPCProvider } from "./utils/trpc";

import { HomeScreen } from "./screens/home";

const App = () => {
  return (
    <TRPCProvider>
      <SafeAreaProvider>
        <HomeScreen />
        <StatusBar />
      </SafeAreaProvider>
    </TRPCProvider>
  );
};

registerRootComponent(App);
