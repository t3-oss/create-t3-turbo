import { NextResponse } from "next/server";

import { generateApiDocument, isOpenApiEnabled } from "@gmacko/api/openapi";

/**
 * GET /api/docs — Serves the OpenAPI spec as JSON.
 *
 * Used by the API docs UI page and external tooling (Postman, Insomnia, etc.).
 * Returns 404 when OpenAPI integration is disabled.
 */
export function GET() {
  if (!isOpenApiEnabled()) {
    return NextResponse.json(
      { error: "OpenAPI documentation is not enabled" },
      { status: 404 },
    );
  }

  const spec = generateApiDocument({
    baseUrl: "/api",
  });

  return NextResponse.json(spec, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
