/** @type {import("@babel/core").ConfigFunction} */
module.exports = (api) => {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-reanimated/plugin"],

    // Necessary to use payload dependencies in API routes.
    // Remove when Expo Router supports dynamic imports + ESM in API routes.
    overrides: [
      {
        test: [/@payloadcms/, /payload/, /prettier/],
        plugins: [
          "babel-plugin-transform-import-meta",
          "module:@reactioncommerce/babel-remove-es-create-require",
        ],
      },
    ],
  };
};
