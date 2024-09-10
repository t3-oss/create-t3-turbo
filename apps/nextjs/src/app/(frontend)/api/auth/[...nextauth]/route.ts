import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { handlers, isSecureContext } from "@acme/auth";

const EXPO_COOKIE_NAME = "__acme-expo-redirect-state";
const AUTH_COOKIE_PATTERN = /authjs\.session-token=([^;]+)/;

/**
 * Noop in production.
 *
 * In development, rewrite the request URL to use localhost instead of host IP address
 * so that Expo Auth works without getting trapped by Next.js CSRF protection.
 * @param req The request to modify
 * @returns The modified request.
 */
function rewriteRequestUrlInDevelopment(req: NextRequest) {
  if (isSecureContext) return req;

  const host = req.headers.get("host");
  const newURL = new URL(req.url);
  newURL.host = host ?? req.nextUrl.host;
  return new NextRequest(newURL, req);
}

export const POST = async (_req: NextRequest) => {
  // First step must be to correct the request URL.
  const req = rewriteRequestUrlInDevelopment(_req);
  return handlers.POST(req);
};

export const GET = async (
  _req: NextRequest,
  props: { params: { nextauth: string[] } },
) => {
  // First step must be to correct the request URL.
  const req = rewriteRequestUrlInDevelopment(_req);

  const nextauthAction = props.params.nextauth[0];
  const isExpoSignIn = req.nextUrl.searchParams.get("expo-redirect");
  const isExpoCallback = cookies().get(EXPO_COOKIE_NAME);

  if (nextauthAction === "signin" && !!isExpoSignIn) {
    // set a cookie we can read in the callback
    // to know to send the user back to expo
    cookies().set({
      name: EXPO_COOKIE_NAME,
      value: isExpoSignIn,
      maxAge: 60 * 10, // 10 min
      path: "/",
    });
  }

  if (nextauthAction === "callback" && !!isExpoCallback) {
    cookies().delete(EXPO_COOKIE_NAME);

    // Run original handler, then extract the session token from the response
    // Send it back via a query param in the Expo deep link. The Expo app
    // will then get that and set it in the session storage.
    const authResponse = await handlers.GET(req);
    const setCookie = authResponse.headers
      .getSetCookie()
      .find((cookie) => AUTH_COOKIE_PATTERN.test(cookie));
    const match = setCookie?.match(AUTH_COOKIE_PATTERN)?.[1];

    if (!match)
      throw new Error(
        "Unable to find session cookie: " +
          JSON.stringify(authResponse.headers.getSetCookie()),
      );

    const url = new URL(isExpoCallback.value);
    url.searchParams.set("session_token", match);
    return NextResponse.redirect(url);
  }

  // Every other request just calls the default handler
  return handlers.GET(req);
};
