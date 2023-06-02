import { type Config } from "tailwindcss";

import { theme } from "@acme/tailwind-config";

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/app/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    ...theme,
  },
};

export default config;
