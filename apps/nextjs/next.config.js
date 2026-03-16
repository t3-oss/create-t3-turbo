import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";
import { createJiti } from "jiti";
import createNextIntlPlugin from "next-intl/plugin";

import { integrations } from "@gmacko/config";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const jiti = createJiti(import.meta.url);

await jiti.import("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,

  transpilePackages: [
    "@gmacko/api",
    "@gmacko/auth",
    "@gmacko/config",
    "@gmacko/db",
    "@gmacko/i18n",
    "@gmacko/logging",
    "@gmacko/monitoring",
    "@gmacko/ui",
    "@gmacko/validators",
  ],

  // Allow external avatar images from OAuth providers
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "cdn.discordapp.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
    ],
  },

  // React Compiler for automatic memoization (React 19+)
  experimental: {
    reactCompiler: true,
    ppr: "incremental",
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            // CSP — adjust connect-src for your PostHog/Sentry hosts
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https://*.posthog.com https://*.sentry.io https://*.ingest.sentry.io wss:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          {
            key: "X-Permitted-Cross-Domain-Policies",
            value: "none",
          },
        ],
      },
      {
        // CORS for API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.CORS_ORIGIN ?? "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Request-ID",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
        ],
      },
    ];
  },
};

const sentryConfig = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

// Apply plugins: bundle analyzer → i18n → Sentry
const configWithAnalyzer = withBundleAnalyzer(config);
const configWithI18n = integrations.i18n
  ? withNextIntl(configWithAnalyzer)
  : configWithAnalyzer;

export default integrations.sentry
  ? withSentryConfig(configWithI18n, sentryConfig)
  : configWithI18n;
