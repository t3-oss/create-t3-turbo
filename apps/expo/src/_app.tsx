import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TRPCProvider } from "./utils/api";

import { HomeScreen } from "./screens/home";

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
