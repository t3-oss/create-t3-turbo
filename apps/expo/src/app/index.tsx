import { Redirect } from "expo-router";

import { authClient } from "~/utils/auth";

/**
 * Root index — redirects to the correct route group based on auth state.
 *
 * Authenticated users → (tabs)/ (bottom tab navigator)
 * Unauthenticated users → (auth)/sign-in
 */
export default function RootIndex() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (session?.user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
