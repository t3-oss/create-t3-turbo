import type { MetadataRoute } from "next";

/**
 * Web App Manifest for PWA support and mobile home-screen installs.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "gmacko.dev — Full-Stack SaaS Starter",
    short_name: "gmacko",
    description:
      "Production-ready monorepo with auth, payments, analytics, and multi-platform support.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
