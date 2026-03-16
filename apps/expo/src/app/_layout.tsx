import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { ErrorBoundary } from "~/components/error-boundary";
import { queryClient } from "~/utils/api";
import { authClient } from "~/utils/auth";
import { Providers } from "../providers";

import "../styles.css";

/**
 * Auth guard — redirects unauthenticated users to sign-in
 * and authenticated users away from auth screens.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session?.user && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (session?.user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, isPending, segments, router]);

  return <>{children}</>;
}

/**
 * Root layout — wraps the entire app with providers and an auth guard.
 *
 * Route groups:
 *   (auth)/    — sign-in, sign-up, forgot-password (no tabs)
 *   (tabs)/    — main app with bottom tab navigation
 *   project/   — project detail (stack pushed on top of tabs)
 *   post/      — post detail (legacy, still functional)
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Providers>
          <AuthGuard>
            <Slot
              screenOptions={{
                headerStyle: {
                  backgroundColor: isDark ? "#09090B" : "#FFFFFF",
                },
                contentStyle: {
                  backgroundColor: isDark ? "#09090B" : "#FFFFFF",
                },
                headerTintColor: isDark ? "#FAFAFA" : "#09090B",
              }}
            />
          </AuthGuard>
          <StatusBar style="auto" />
        </Providers>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
