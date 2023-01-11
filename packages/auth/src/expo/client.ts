/* eslint-disable @typescript-eslint/no-explicit-any */

// Note about signIn() and signOut() methods:
//
// On signIn() and signOut() we pass 'json: true' to request a response in JSON
// instead of HTTP as redirect URLs on other domains are not returned to
// requests made using the fetch API in the browser, and we need to ask the API
// to return the response as a JSON object (the end point still defaults to
// returning an HTTP response with a redirect for non-JavaScript clients).
//
// We use HTTP POST requests with CSRF Tokens to protect against CSRF attacks.

import { Session } from "next-auth";
import { NextAuthClientConfig as AuthClientConfig } from "next-auth/client/_utils";
import _logger, { LoggerInstance, proxyLogger } from "next-auth/utils/logger";
import parseUrl from "next-auth/utils/parse-url";

import type { ClientSafeProvider, LiteralUnion, SignInResponse } from "./types";

import type {
  BuiltInProviderType,
  RedirectableProviderType,
} from "next-auth/providers";

import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Alert } from "react-native";
import "react-native-url-polyfill/auto";

const storageKeys = {
  sessionToken: "next-auth.sessionToken",
};

export function apiBaseUrl(__NEXTAUTH: AuthClientConfig) {
  return `${__NEXTAUTH.baseUrlServer}${__NEXTAUTH.basePathServer}`;
}

export async function fetchData<T extends object>(
  path: string,
  __NEXTAUTH: AuthClientConfig,
  logger: LoggerInstance,
  params?: Record<string, any>,
): Promise<T | null> {
  const url = `${apiBaseUrl(__NEXTAUTH)}/proxy`;

  const sessionToken = await SecureStore.getItemAsync(storageKeys.sessionToken);
  try {
    const options: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: path,
        sessionToken,
        ...params,
      }),
    };
    const res = await fetch(url, options);
    const data = (await res.json()) as T;
    if (!res.ok) throw data;
    return Object.keys(data).length > 0 ? data : null; // Return null if data empty
  } catch (error) {
    logger.error("CLIENT_FETCH_ERROR", { error: error as Error, url });
    return null;
  }
}

export async function getSignInInfo({
  provider,
  proxyRedirectUri,
}: {
  provider: string;
  proxyRedirectUri: string;
}) {
  const res = await fetchData<{
    state: string;
    stateEncrypted: string;
    codeVerifier: string;
    codeChallenge: string;
    clientId: string;
  }>("signin", __NEXTAUTH, logger, {
    providerId: provider,
    callbackUrl: proxyRedirectUri,
  });
  console.log("getSignInInfo", res);
  return res;
}

const nextAuthUrl = Constants.expoConfig?.extra?.nextAuthUrl as string;

export const __NEXTAUTH: AuthClientConfig = {
  baseUrl: parseUrl(nextAuthUrl).origin,
  basePath: parseUrl(nextAuthUrl).path,
  baseUrlServer: parseUrl(nextAuthUrl).origin,
  basePathServer: parseUrl(nextAuthUrl).path,
  _lastSync: 0,
  _session: undefined,
  _getSession: () => {
    /** no-op */
  },
};

export const logger = proxyLogger(_logger, __NEXTAUTH.basePath);

export async function getSession() {
  const session = await fetchData<Session>("session", __NEXTAUTH, logger);
  return session;
}

/**
 * It calls `/api/auth/providers` and returns
 * a list of the currently configured authentication providers.
 * It can be useful if you are creating a dynamic custom sign in page.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#getproviders)
 */
export async function getProviders() {
  return await fetchData<
    Record<LiteralUnion<BuiltInProviderType>, ClientSafeProvider>
  >("providers", __NEXTAUTH, logger);
}

export interface SigninResult {
  result: AuthSession.AuthSessionResult;
  state: string;
  stateEncrypted: string;
  codeVerifier?: string;
  provider: string;
}

/**
 * Client-side method to initiate a signin flow
 * or send the user to the signin page listing all possible providers.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#signin)
 */
export async function signIn<
  P extends RedirectableProviderType | undefined = undefined,
>(
  initiateExpoAuthFlow: () => Promise<SigninResult | null>,
): Promise<
  P extends RedirectableProviderType ? SignInResponse | undefined : undefined
> {
  console.log("nextAuthUrl", nextAuthUrl);
  console.log("__NEXTAUTH", __NEXTAUTH);
  const signinResult = await initiateExpoAuthFlow();
  if (signinResult === null) {
    // The initiate function should show the error themselves
    return;
  }
  const { result, state, codeVerifier, stateEncrypted, provider } =
    signinResult;

  if (result.type !== "success") return; // TODO: handle other results

  const data = await fetchData<{ error?: string; sessionToken?: string }>(
    "callback",
    __NEXTAUTH,
    logger,
    {
      providerId: provider,
      code: result.params.code,
      state,
      stateEncrypted,
      codeVerifier,
    },
  );
  if (!data) {
    Alert.alert("Error", "Callback error.");
    return;
  }
  const { error, sessionToken } = data;
  if (!!error || !sessionToken) {
    switch (error) {
      case "OAuthAccountNotLinked": {
        Alert.alert(
          "Error",
          "The email associated with the account you just logged in is being used by another account. Please log into that account and then link to other providers afterwards.",
        );
        break;
      }
    }
    return;
  }
  if (sessionToken) {
    await SecureStore.setItemAsync(storageKeys.sessionToken, sessionToken);
    await __NEXTAUTH._getSession({ event: "storage" });
  }
}

/**
 * Signs the user out, by removing the session cookie.
 * Automatically adds the CSRF token to the request.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#signout)
 */
export async function signOut() {
  const data = await fetchData("signout", __NEXTAUTH, logger);

  if (data) {
    await SecureStore.deleteItemAsync(storageKeys.sessionToken);

    // Trigger session refetch to update AuthContext state.
    await __NEXTAUTH._getSession({ event: "storage" });
  }
}
