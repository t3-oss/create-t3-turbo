import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { GET as _GET, POST } from "@acme/auth";

export const runtime = "edge";

const expoRedirectCookieName = "__acme-expo-redirect-state";
const setCookieMatchPattern = /next-auth\.session-token=([^;]+)/;

export const GET = async (
  req: NextRequest,
  props: { params: { nextauth: string[] } },
) => {
  const nextauthAction = props.params.nextauth[0];
  const isExpoSignIn = req.nextUrl.searchParams.get("expo-redirect");
  const isExpoCallback = cookies().get(expoRedirectCookieName);

  if (nextauthAction === "signin" && !!isExpoSignIn) {
    // set a cookie we can read in the callback
    // to know to send the user back to expo
    cookies().set({
      name: expoRedirectCookieName,
      value: isExpoSignIn,
      maxAge: 60 * 10, // 10 min
      path: "/",
    });
  }

  if (nextauthAction === "callback" && !!isExpoCallback) {
    cookies().delete(expoRedirectCookieName);

    const authResponse = await _GET(req);
    const setCookie = authResponse.headers.getSetCookie()[0];
    const match = setCookie?.match(setCookieMatchPattern)?.[1];
    if (!match) throw new Error("No session cookie found");

    const url = new URL(isExpoCallback.value);
    url.searchParams.set("session_token", match);
    return NextResponse.redirect(url);
  }

  // Every other request just calls the default handler
  return _GET(req);
};

export { POST };
