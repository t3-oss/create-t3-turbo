import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { trpc } from "./utils/trpc";
import { transformer } from "@acme/api/transformer";

import { HomeScreen } from "./screens/home";
import { Text } from "react-native";

// `localhost` might not work in all cases
// see https://github.com/t3-oss/create-t3-turbo/issues/10
const url = "http://localhost:3000/api/trpc";

const App = () => {
  const [queryClient] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() => trpc.createClient({ url, transformer }));

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
