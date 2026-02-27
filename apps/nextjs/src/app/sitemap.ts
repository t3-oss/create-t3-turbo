import type { MetadataRoute } from "next";

import { env } from "~/env";

/**
 * Dynamic sitemap generation for SEO.
 *
 * Covers all public-facing routes. For dynamic routes (blog posts,
 * product pages, etc.), query your database here and return entries
 * for each public resource.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    env.VERCEL_ENV === "production"
      ? "https://gmacko.dev"
      : "http://localhost:3000";

  // Static routes — add new public pages here
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-02-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-02-01"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date("2026-02-01"),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  // TODO: Add dynamic routes here, e.g.:
  // const posts = await db.query.Post.findMany({ columns: { id: true, updatedAt: true } });
  // const postRoutes = posts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.id}`,
  //   lastModified: post.updatedAt,
  //   changeFrequency: "monthly" as const,
  //   priority: 0.7,
  // }));

  return [...staticRoutes];
}
