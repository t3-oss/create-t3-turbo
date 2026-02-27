import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { integrations } from "@gmacko/config";

import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Generate X-Request-ID for tracing
  const requestId =
    request.headers.get("x-request-id") ??
    `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

  // If i18n is enabled, run the locale middleware
  if (integrations.i18n) {
    const response = intlMiddleware(request);
    if (response) {
      response.headers.set("x-request-id", requestId);
      return response;
    }
  }

  // For non-i18n paths or when i18n is disabled, pass through with request ID
  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);
  return response;
}

export const config = {
  // Match all pathnames except for:
  // - API routes
  // - Static files (images, fonts, etc.)
  // - Next.js internals
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*).*)",
    // Also match the root
    "/",
  ],
};
