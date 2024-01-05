import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { GET as DEFAULT_GET, POST } from "@acme/auth";

export const runtime = "edge";

const EXPO_COOKIE_NAME = "__acme-expo-redirect-state";
const AUTH_COOKIE_PATTERN = /authjs\.session-token=([^;]+)/;

export const GET = async (
  req: NextRequest,
  props: { params: { nextauth: string[] } },
) => {
  const action = props.params.nextauth[0];
  const isExpoSignIn = req.nextUrl.searchParams.get("expo-redirect");
  const isExpoCallback = cookies().get(EXPO_COOKIE_NAME);

  if (action === "signin" && !!isExpoSignIn) {
    cookies().set({
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      name: EXPO_COOKIE_NAME,
      value: isExpoSignIn,
      maxAge: 60 * 60,
      path: "/",
    });
  }

  if (action === "callback" && !!isExpoCallback) {
    cookies().delete(EXPO_COOKIE_NAME);

    const authResponse = await DEFAULT_GET(req);
    const setCookie = authResponse.headers.getSetCookie()[0];
    const match = setCookie?.match(AUTH_COOKIE_PATTERN)?.[1];
    if (!match) throw new Error("Unable to find session cookie");

    const url = new URL(isExpoCallback.value);
    url.searchParams.set("session_token", match);
    return NextResponse.redirect(url);
  }

  return DEFAULT_GET(req);
};

export { POST };
