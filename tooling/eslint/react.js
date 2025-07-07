import reactPlugin from "eslint-plugin-react";
import * as reactHooks from "eslint-plugin-react-hooks";

import baseConfig from "./base.js";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  ...baseConfig,
  reactHooks.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      react: reactPlugin,
    },
    rules: {
      ...reactPlugin.configs["jsx-runtime"].rules,
      "react-hooks/react-compiler": "error",
    },
    languageOptions: {
      globals: {
        React: "writable",
      },
    },
  },
];
