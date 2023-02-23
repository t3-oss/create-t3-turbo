/** @type {import("tailwindcss").Config} */
const config = {
  content: ["./src/**/*.tsx"],
  // @ts-ignore
  presets: [require("@acme/tailwind-config")],
};

module.exports = config;
