import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { trpc } from "./utils/trpc";
import { transformer } from "@acme/api/transformer";

import { HomeScreen } from "./screens/home";

/**
 * Gets the IP address of your host-machine. If it cannot automatically find it,
 * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
 * you don't have anything else running on it, or you'd have to change it.
 */
import Constants from "expo-constants";
const localhost = Constants.manifest?.debuggerHost?.split(":")[0];
if (!localhost) throw new Error("failed to get localhost, configure it manually");
const url = `http://${localhost}:3000/api/trpc`;

const App = () => {
  const [queryClient] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() => trpc.createClient({ url, transformer }));

  console.log(Constants.manifest);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <HomeScreen />
          <StatusBar />
        </SafeAreaProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
};

registerRootComponent(App);
