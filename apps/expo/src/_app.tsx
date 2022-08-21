import { registerRootComponent } from "expo";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { trpc } from "./utils/trpc";
import { transformer } from "@acme/api/transformer";

import { HomeScreen } from "./screens/home";

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
