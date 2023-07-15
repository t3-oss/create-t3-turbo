/** @type {import('eslint').Linter.Config} */
const config = {
  root: true,
  extends: [
    "@acme/eslint-config/base",
    "@acme/eslint-config/nextjs",
    "@acme/eslint-config/react",
  ],
};

module.exports = config;
