import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { GET as DEFAULT_GET, POST } from "@acme/auth";

export const runtime = "edge";

const EXPO_COOKIE_NAME = "__acme-expo-redirect-state";
const AUTH_COOKIE_PATTERN = /authjs\.session-token=([^;]+)/;

const getToken = (res: Response) => {
  for (const candidate of res.headers.getSetCookie()) {
    const match = candidate.match(AUTH_COOKIE_PATTERN);
    if (match?.[1]) return match[1];
  }
  throw new Error("Unable to find session cookie");
};

export const GET = async (
  req: NextRequest,
  props: { params: { nextauth: string[] } },
) => {
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

    const authResponse = await DEFAULT_GET(req);
    const url = new URL(isExpoCallback.value);
    url.searchParams.set("session_token", getToken(authResponse));
    return NextResponse.redirect(url);
  }

  // Every other request just calls the default handler
  return DEFAULT_GET(req);
};

export { POST };
