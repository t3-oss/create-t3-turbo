import { type Config } from "tailwindcss";

import { theme } from "@acme/tailwind-config";

const config: Config = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "../../packages/app/**/*.{js,jsx,ts,tsx}",
  ],
  plugins: [require("nativewind/tailwind/css")],
  important: "html",
  theme: {
    ...theme,
  },
};

export default config;
