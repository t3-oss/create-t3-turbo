import * as Linking from "expo-linking";
import * as Browser from "expo-web-browser";

import { api } from "./api";
import { getBaseUrl } from "./base-url";
import { deleteToken, setToken } from "./session-store";

export const signIn = async () => {
  const authUrl = `${getBaseUrl()}/api/auth/signin`;
  const redirectUrl = Linking.createURL("/login");
  const result = await Browser.openAuthSessionAsync(
    `${authUrl}?expo-redirect=${encodeURIComponent(redirectUrl)}`,
  );

  if (result.type !== "success") return;
  const url = Linking.parse(result.url);
  const token = String(url.queryParams?.session_token);

  if (!token) return;
  await setToken(token);
};

export const useUser = () => {
  const { data: session } = api.auth.getSession.useQuery();
  return session?.user ?? null;
};

export const useSignIn = () => {
  const utils = api.useUtils();

  return async () => {
    await signIn();
    await utils.invalidate();
  };
};

export const useSignOut = () => {
  const utils = api.useUtils();
  const signOut = api.auth.signOut.useMutation();

  return async () => {
    const res = await signOut.mutateAsync();
    if (!res.success) return;
    await deleteToken();
    await utils.invalidate();
  };
};
