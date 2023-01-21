/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // NextJS
    "./src/**/*.{ts,tsx}",
    // Expo
    "./index.ts",
    "./app/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
