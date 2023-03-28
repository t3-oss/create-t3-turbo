// Would be better if `index.js` was TypeScript... something broke when I tried that though.
declare module "@acme/tailwind-config" {
  import type { Config } from "tailwindcss";
  const config: Config;
  export default config;
}

declare module "@acme/tailwind-config/postcss" {
  const config: { plugins: Record<string, unknown> };
  export default config;
}
