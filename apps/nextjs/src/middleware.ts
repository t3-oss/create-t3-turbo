import { auth } from "@acme/auth";
import { csrfMiddleware } from "@acme/auth/middleware";

export default auth((req) => {
  // Add custom logic here, if desired
  return csrfMiddleware(req);
});

// Read more: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
