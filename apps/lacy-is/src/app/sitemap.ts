import type { MetadataRoute } from "next";

// Only the home page is a finished page; /thinking is a placeholder and is noindexed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://lacy.is", changeFrequency: "monthly", priority: 1 }];
}
