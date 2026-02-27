import type { MetadataRoute } from "next";

import { env } from "~/env";

/**
 * Dynamic robots.txt generation.
 *
 * Blocks crawlers from auth, API, admin, settings, and onboarding routes.
 * Allows all public pages. Points crawlers to sitemap.xml.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    env.VERCEL_ENV === "production"
      ? "https://gmacko.dev"
      : "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/settings/",
          "/onboarding/",
          "/_next/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
