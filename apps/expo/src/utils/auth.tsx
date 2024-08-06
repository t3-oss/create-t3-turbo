import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import * as Browser from "expo-web-browser";

import { api } from "@acme/api/provider";

import { deleteToken, setToken } from "~/utils/token";

export const signIn = async () => {
  const signInUrl = `/api/auth/signin`;
  const redirectTo = Linking.createURL("/login");
  const result = await Browser.openAuthSessionAsync(
    `${signInUrl}?expo-redirect=${encodeURIComponent(redirectTo)}`,
    redirectTo,
  );

  if (result.type !== "success") return;
  const url = Linking.parse(result.url);
  const sessionToken = String(url.queryParams?.session_token);
  if (!sessionToken) return;

  return sessionToken;
};

export const useUser = () => {
  const { data: user } = api.auth.getUser.useQuery();
  return user;
};

export const useSignIn = () => {
  const utils = api.useUtils();
  const router = useRouter();

  return async () => {
    const token = await signIn();
    if (token) setToken(token);
    await utils.invalidate();
    router.replace("/");
  };
};

export const useSignOut = () => {
  const utils = api.useUtils();
  const router = useRouter();

  return async () => {
    await deleteToken();
    await utils.invalidate();
    router.replace("/");
  };
};
