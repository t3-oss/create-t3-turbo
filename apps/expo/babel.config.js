const jiti = require("jiti");
const { transform } = require("sucrase");

let _tailwindConfig = null;
/**
 * Transpiles tailwind.config.ts for babel
 * Fix until nativewind babel plugin supports tailwind.config.ts files
 */
function lazyTranspileTailwindConfig() {
  return (
    _tailwindConfig ??
    jiti(__filename, {
      interopDefault: true,
      transform: (options) => {
        return transform(options.source, {
          transforms: ["typescript", "imports"],
        });
      },
    })("./tailwind.config.ts")
  );
}

/** @type {import("@babel/core").ConfigFunction} */
module.exports = function (api) {
  api.cache.forever();

  // Make Expo Router run from `src/app` instead of `app`.
  // Path is relative to `/node_modules/expo-router`
  process.env.EXPO_ROUTER_APP_ROOT = "../../apps/expo/src/app";

  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "nativewind/babel",
        {
          tailwindConfig: lazyTranspileTailwindConfig(),
        },
      ],
      "expo-router/babel",
      ["module-resolver", { alias: { "~": "./src" } }],
    ],
  };
};
