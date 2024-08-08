const { createRequestHandler } = require("@expo/server/adapter/vercel");

module.exports = createRequestHandler({
  build: require("path").join(__dirname, "../dist/server"),
  mode: process.env.NODE_ENV,
});
