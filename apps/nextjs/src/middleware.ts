import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

//import { client } from "@acme/auth/middleware";

export default function authMiddleware(_request: NextRequest) {
  /**
   * This is an example of how you can use the client to get the session
   * from the request headers.
   *
   * You can then use this session to make decisions about the request
   */
  //   const { data: session } = await client.getSession({
  //     fetchOptions: {
  //       headers: {
  //         cookie: request.headers.get("cookie") ?? "",
  //       },
  //     },
  //   });

  //   if (!session) {
  //     return NextResponse.redirect(new URL("/sign-in", request.url));
  //   }

  return NextResponse.next();
}

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
