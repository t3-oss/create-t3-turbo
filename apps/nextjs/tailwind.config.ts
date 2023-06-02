import { type Config } from "tailwindcss";

import { theme } from "@acme/tailwind-config";

const config: Config = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "../../packages/**/*.{js,jsx,ts,tsx}",
  ],
  plugins: [require("nativewind/tailwind/css")],
  important: "html",
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  theme: {
    ...theme,
  },
};

export default config;
