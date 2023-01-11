import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { TRPCProvider } from "./utils/api";
import { SessionProvider } from "next-auth/expo";

import { HomeScreen } from "./screens/home";
import { AuthScreen } from "./screens/auth";

export const App = () => {
  return (
    <SessionProvider>
      <TRPCProvider>
        <SafeAreaProvider>
          {/* <HomeScreen /> */}
          <AuthScreen />
          <StatusBar />
        </SafeAreaProvider>
      </TRPCProvider>
    </SessionProvider>
  );
};
