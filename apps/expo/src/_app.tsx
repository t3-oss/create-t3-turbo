import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { HomeScreen } from "./screens/home";
import { TRPCProvider } from "./utils/api";

export const App = () => {
  return (
    <TRPCProvider>
      <SafeAreaProvider>
        <HomeScreen />
        <StatusBar />
      </SafeAreaProvider>
    </TRPCProvider>
  );
};
