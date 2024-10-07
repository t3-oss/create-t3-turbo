import baseConfig from "@acme/eslint-config/base";
import reactConfig from "@acme/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".expo/**", "expo-plugins/**"],
  },
  ...baseConfig,
  ...reactConfig,
  {
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@acme/api",
              message: "Only type imports from '@acme/api' are allowed",
              allowTypeImports: true,
            },
          ],
          patterns: [
            {
              group: ["@acme/api/*", "!@acme/api/transformer"],
              message: "Only certain modules from '@acme/api' can be imported",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
];
