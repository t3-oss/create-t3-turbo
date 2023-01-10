import { getSignInInfo, SigninResult } from "./client";
import * as AuthSession from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";
import Constants from "expo-constants";
import { Alert } from "react-native";

const projectNameForProxy = Constants.manifest2?.extra?.scopeKey;

export const nativeApple = async (): Promise<SigninResult | null> => {
  const redirectUri = AuthSession.makeRedirectUri({
    useProxy: false,
    projectNameForProxy,
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
    provider: "expo-apple",
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

export const nativeGithub = async (): Promise<SigninResult | null> => {
  const proxyRedirectUri = AuthSession.makeRedirectUri({ useProxy: true }); // https://auth.expo.io
  console.log("proxyRedirectUri", proxyRedirectUri);
  const signinInfo = await getSignInInfo({
    provider: "github",
    proxyRedirectUri,
  });
  if (!signinInfo) {
    Alert.alert("Error", "Couldn't get sign in info from server");
    return null;
  }
  const { state, codeChallenge, stateEncrypted, codeVerifier, clientId } =
    signinInfo;

  // This corresponds to useLoadedAuthRequest
  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ["read:user", "user:email", "openid"],
    redirectUri: proxyRedirectUri,
    codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
  });
  const discovery = {
    authorizationEndpoint: "https://github.com/login/oauth/authorize",
    tokenEndpoint: "https://github.com/login/oauth/access_token",
    revocationEndpoint:
      "https://github.com/settings/connections/applications/XXXXXXXXXXX", // ignore this, it should be set to a clientId.
  };

  request.state = state;
  request.codeChallenge = codeChallenge;
  await request.makeAuthUrlAsync(discovery);
  console.log("request", request);

  // useAuthRequestResult
  const result = await request.promptAsync(discovery, { useProxy: true });
  return {
    result,
    state,
    stateEncrypted,
    codeVerifier,
    provider: "expo-github",
  };
};
