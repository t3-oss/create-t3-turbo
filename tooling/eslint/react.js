import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  reactHooks.configs.flat["recommended-latest"],
  {
    files: ["**/*.ts", "**/*.tsx"],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat["jsx-runtime"],
    languageOptions: {
      ...reactPlugin.configs.flat.recommended?.languageOptions,
      ...reactPlugin.configs.flat["jsx-runtime"]?.languageOptions,
      globals: {
        React: "writable",
      },
    },
  },
];
