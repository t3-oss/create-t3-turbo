// Importing env files here to validate on build
import "./src/env.mjs";
import "@acme/auth/env.mjs";
import { withExpo } from "@expo/next-adapter";

/** @type {import("next").NextConfig} */
const config = {
  // reanimated (and thus, Moti) doesn't work with strict mode currently...
  // https://github.com/nandorojo/moti/issues/224
  // https://github.com/necolas/react-native-web/pull/2330
  // https://github.com/nandorojo/moti/issues/224
  // once that gets fixed, set this back to true
  reactStrictMode: false,
  transpilePackages: [
    "react-native",
    "react-native-web",
    "solito",
    "moti",
    "app",
    "react-native-reanimated",
    "nativewind",
    "react-native-gesture-handler",
    /** Enables hot reloading for local packages without a build step */
    "@acme/api",
    "@acme/auth",
    "@acme/db",
    "@acme/app",
  ],
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default withExpo(config);
