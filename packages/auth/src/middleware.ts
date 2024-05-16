import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function csrfMiddleware(request: NextRequest) {
  if (request.method === "GET") {
    return NextResponse.next();
  }
  const originHeader = request.headers.get("Origin");
  // NOTE: You may need to use `X-Forwarded-Host` instead
  // You can also use VERCEL_URL or AUTH_URL, or hard-code your urls, etc.
  const hostHeader = request.headers.get("Host");
  if (
    !originHeader ||
    !hostHeader ||
    !verifyRequestOrigin(originHeader, [hostHeader])
  ) {
    return new NextResponse(null, {
      status: 403,
    });
  }
  return NextResponse.next();
}

export function verifyRequestOrigin(
  origin: string,
  allowedDomains: string[],
): boolean {
  if (!origin || allowedDomains.length === 0) return false;
  const originHost = safeURL(origin)?.host ?? null;
  if (!originHost) return false;
  for (const domain of allowedDomains) {
    let host: string | null;
    if (domain.startsWith("http://") || domain.startsWith("https://")) {
      host = safeURL(domain)?.host ?? null;
    } else {
      host = safeURL("https://" + domain)?.host ?? null;
    }
    if (originHost === host) return true;
  }
  return false;
}

function safeURL(url: URL | string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}
