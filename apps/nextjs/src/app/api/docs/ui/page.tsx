import type { Metadata } from "next";

import { integrations } from "@gmacko/config";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "Interactive API documentation",
  robots: { index: false, follow: false },
};

/**
 * API Documentation UI — Renders an interactive API reference.
 *
 * Uses Scalar (https://github.com/scalar/scalar) for a modern, themeable
 * API docs experience. Falls back to a "not enabled" message when
 * the OpenAPI integration is disabled.
 *
 * Enable with: `integrations.openapi = true` in @gmacko/config
 *
 * Note: This is a standalone HTML page that loads Scalar's CDN build.
 * For a React-embedded version, install @scalar/api-reference-react.
 */
export default function ApiDocsPage() {
  if (!integrations.openapi) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">API Documentation</h1>
          <p className="text-muted-foreground mt-2">
            OpenAPI documentation is not enabled.
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Set <code className="bg-muted rounded px-1">integrations.openapi = true</code> in{" "}
            <code className="bg-muted rounded px-1">@gmacko/config</code> to enable.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Scalar API Reference loaded from CDN for zero-dependency setup */}
      {/* For production, install @scalar/api-reference-react instead */}
      <script
        id="api-reference"
        data-url="/api/docs"
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              var el = document.getElementById('api-reference-container');
              if (window.ScalarApiReference) {
                window.ScalarApiReference.mount(el, {
                  spec: { url: '/api/docs' },
                  theme: 'default',
                  darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
                });
              }
            });
          `,
        }}
      />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference" />
      <div id="api-reference-container" />
    </div>
  );
}
