/** @type {import("tailwindcss").Config} */
module.exports = {
  presets: [require("@acme/tailwind-config")],
  // We have to include those files so that expo-router's pages directory is parsed by nativewind
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
};
