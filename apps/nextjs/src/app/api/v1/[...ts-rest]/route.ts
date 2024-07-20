import { createNextHandler } from "@ts-rest/serverless/next";

import { apiRouter, contract } from "@acme/api";

export const handler = createNextHandler(contract, apiRouter, {
  handlerType: "app-router",
  basePath: "/api/v1",
  jsonQuery: true,
  responseValidation: true,
});

export { handler as GET, handler as POST };
