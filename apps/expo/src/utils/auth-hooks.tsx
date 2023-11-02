import * as Linking from "expo-linking";
import * as Browser from "expo-web-browser";

import { api } from "./api";
import { deleteToken, setToken } from "./session-store";

export const signIn = async () => {
  const signInUrl = "http://localhost:3000/api/auth/signin";
  const redirectTo = "exp://192.168.10.181:8081/login";
  const result = await Browser.openAuthSessionAsync(
    `${signInUrl}?expo-redirect=${encodeURIComponent(redirectTo)}`,
    redirectTo,
  );
  if (result.type !== "success") return;

  const url = Linking.parse(result.url);
  const sessionToken = String(url.queryParams?.session_token);
  if (!sessionToken) return;

  await setToken(sessionToken);
  // ...
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
