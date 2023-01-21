import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TRPCProvider } from "../src/utils/api";
import { Stack } from "expo-router";

// This is your app's layout. The <Stack /> component is where your app's screens will be rendered.
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
