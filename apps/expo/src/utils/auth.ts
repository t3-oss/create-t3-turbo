import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as Browser from "expo-web-browser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { trpc } from "./api";
import { getBaseUrl } from "./base-url";
import { deleteToken, setToken } from "./session-store";

export const signIn = async () => {
  const signInUrl = `${getBaseUrl()}/api/auth/signin`;
  const redirectTo = Linking.createURL("/login");
  const result = await Browser.openAuthSessionAsync(
    `${signInUrl}?expo-redirect=${encodeURIComponent(redirectTo)}`,
    redirectTo,
  );

  if (result.type !== "success") return false;
  const url = Linking.parse(result.url);
  const sessionToken = String(url.queryParams?.session_token);
  if (!sessionToken) throw new Error("No session token found");

  setToken(sessionToken);

  return true;
};

export const useUser = () => {
  const { data: session } = useQuery(trpc.auth.getSession.queryOptions());
  return session?.user ?? null;
};

export const useSignIn = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return async () => {
    const success = await signIn();
    if (!success) return;

    await queryClient.invalidateQueries(trpc.pathFilter());
    router.replace("/");
  };
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  const signOut = useMutation(trpc.auth.signOut.mutationOptions());
  const router = useRouter();

  return async () => {
    const res = await signOut.mutateAsync();
    if (!res.success) return;
    await deleteToken();
    await queryClient.invalidateQueries(trpc.pathFilter());
    router.replace("/");
  };
};
