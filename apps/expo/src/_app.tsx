import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getBaseUrl, TRPCProvider } from "./utils/api";
import { SessionProvider } from "@acme/auth/src/expo/session";

// import { HomeScreen } from "./screens/home";
import { AuthScreen } from "./screens/auth";

export const App = () => {
  const baseUrl = getBaseUrl();
  console.log("Using baseUrl", baseUrl);
  return (
    <SessionProvider baseUrl={"http://localhost:3000"}>
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
