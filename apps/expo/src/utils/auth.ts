import * as AuthSession from "expo-auth-session";
import { SigninResult, getSignInInfo } from "next-auth/expo";

export const nativeProviders = {
  discord: "discord-expo",
  github: "github-expo",
} as const;

export const isValidProvider = (
  k: string,
): k is keyof typeof nativeProviders => {
  return k in nativeProviders;
};

export const nativeDiscoveryUrls = {
  discord: {
    authorizationEndpoint: "https://discord.com/api/oauth2/authorize",
    tokenEndpoint: "https://discord.com/api/oauth2/token",
    revocationEndpoint: "https://discord.com/api/oauth2/token/revoke",
  },
  github: {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    revocationEndpoint:
      "https://github.com/settings/connections/applications/XXXXXXXXXXX", // ignore this, it should be set to a clientId.
  },
};

export const socialLogin = async (
  baseProvider: keyof typeof nativeProviders,
): Promise<SigninResult | null> => {
  const proxyRedirectUri = AuthSession.makeRedirectUri({ useProxy: true });

  const provider = isValidProvider(baseProvider)
    ? nativeProviders[baseProvider]
    : baseProvider;

  const signinInfo = await getSignInInfo({
    provider: provider,
    proxyRedirectUri,
  });

  console.log("Signin info", signinInfo);
  console.log("redirect", proxyRedirectUri);

  if (!signinInfo) {
    Alert.alert("Error", "Couldn't get sign in info from server");
    return null;
  }

  const { state, codeChallenge, stateEncrypted, codeVerifier, clientId } =
    signinInfo;

  const request = new AuthSession.AuthRequest({
    clientId: clientId,
    scopes: ["identify", "email"],
    redirectUri: proxyRedirectUri,
    usePKCE: false,
  });

  const discovery = nativeDiscoveryUrls[baseProvider];

  request.state = state;
  request.codeChallenge = codeChallenge;
  await request.makeAuthUrlAsync(discovery);

  const result = await request.promptAsync(discovery, { useProxy: true });

  return {
    result,
    state,
    stateEncrypted,
    codeVerifier,
    provider,
  };
};

import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";
import { Alert } from "react-native";

export const nativeApple = async (): Promise<SigninResult | null> => {
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: false,
    projectNameForProxy: Constants.manifest2?.extra?.scopeKey as string,
  });
  const signinInfo = await getSignInInfo({
    provider: "expo-apple",
    proxyRedirectUri: redirectUri,
  });

  if (!signinInfo) {
    Alert.alert("Error", "Couldn't get sign in info from server");
    return null;
  }
  const { state, stateEncrypted, codeVerifier } = signinInfo;
  let credential: AppleAuthentication.AppleAuthenticationCredential | undefined;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      ],
      state,
    });
  } catch (e) {
    console.log("Error signing in with Apple", e);
    return null;
  }

  return {
    codeVerifier,
    provider: "apple-expo",
    result: {
      authentication: null,
      error: null,
      errorCode: null,
      params: {
        code: credential?.authorizationCode as string,
        state,
      },
      type: "success",
      url: "",
    },
    state,
    stateEncrypted,
  };
};
