import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TRPCProvider } from "../src/utils/api";
import { Stack } from "expo-router";

const Layout: React.FC = () => {
  return (
    <TRPCProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar />
      </SafeAreaProvider>
    </TRPCProvider>
  );
};

export default Layout;
