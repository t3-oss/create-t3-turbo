---
sidebar_position: 2
---

In this repo, we use tRPC to make end-to-end typesafe APIS without any code generation. If its your first time using tRPC, we recommend reading the tRPC section from the [Create T3 App docs](https://create.t3.gg/en/usage/trpc) first. This will give you an in-depth look of how tRPC works and how it is configured.

In Create T3 Turbo, tRPC is configured so that it works with both and expo next.js application. Note that the Next.js application with tRPC must be deployed in order for the Expo app to communicate with the server in a production environment.

## Files

Let's have a look at the different tRPC boilerplates files that create t3 turbo sets up for you.

## `packages/api`

In this directory is where the base configuration of tRPC is done. In here you will find the following files:

### `src/router`

This is where you define the routes and procedures of your API. By convention, you create [separate routers](https://trpc.io/docs/server/routers) for related procedures.

### `src/root.ts`

This is where you [merge](https://trpc.io/docs/server/merging-routers) all of your routers and export them as a single app router.

### `src/trpc.ts`

This file is split up in two parts, context creation and tRPC initialization:

1. We define the context that is passed to your tRPC procedures. Context is data that all of your tRPC procedures will have access to, and is a great place to put things like database connections, authentication information, etc. In create-t3-app we use two functions, to enable using a subset of the context when we do not have access to the request object.

- `createInnerTRPCContext`: This is where you define context which doesn't depend on the request, e.g. your database connection. You can use this function for [integration testing](#sample-integration-test) or [ssg-helpers](https://trpc.io/docs/v10/ssg-helpers) where you don't have a request object.

- `createTRPCContext`: This is where you define context which depends on the request, e.g. the user's session. You request the session using the `opts.req` object, and then pass the session down to the `createInnerTRPCContext` function to create the final context.

2. We initialize tRPC and define reusable [procedures](https://trpc.io/docs/v10/procedures) and [middlewares](https://trpc.io/docs/v10/middlewares). By convention, you shouldn't export the entire `t`-object but instead, create reusable procedures and middlewares and export those.

You'll notice we use `superjson` as [data transformer](https://trpc.io/docs/v10/data-transformers). This makes it so that your data types are preserved when they reach the client, so if you for example send a `Date` object, the client will return a `Date` and not a string which is the case for most APIs.s

### `index.ts`

Here is where you export inference helpers for input and output types. You also re-export the appRouter, createTRPCContext and the type AppRouter to be consumed in other parts of the application.

## `apps/expo/src/utils/api.tsx`

Here is the expo application entry point for tRPC. This is where you’ll import the router’s type definition and create your tRPC client along with the react-query hooks. Since we enabled superjson as our data transformer on the backend, we need to enable it on the expo application as well. This is because the serialized data from the backend is deserialized on the expo application.

We export a [helper type](https://trpc.io/docs/v10/infer-types#additional-dx-helper-type) which you can use to infer your types on the expo application.

You'll define your tRPC [links](https://trpc.io/docs/v10/links) here, which determines the request flow from the client to the server. We use the "default" [`httpBatchLink`](https://trpc.io/docs/v10/links/httpBatchLink) which enables [request batching](https://cloud.google.com/compute/docs/api/how-tos/batch). The httpBatchLink uses the `getBaseUrl` function which determines the IP adress of your host machine. In development it uses `localhost:3000` and in production, you should set the baseUrl to your production API URL.

## `apps/nextjs/src/utils/api.tsx`

Here is the front-end entry point for tRPC. This is where you will import the router's type definition and create your tRPC client. Similar in the expo application, we also use superjson as the transformer in the front end.

You will also define your tRPC [links](https://trpc.io/docs/v10/links) which determines the request flow from the client to the server. We use httpBatchLink similar to the expo application and we also use loggerLink which outputs useful logs during development.

Lastly, we export helper types which you can use to infer your types on the Next.js application.

## `apps/nextjs/pages/api/trpc/[trpc].ts`

This is the entry point for your API and exposes the tRPC router. Normally, you won't touch this file very much, but if you need to, for example, enable CORS middleware or similar, it's useful to know that the exported `createNextApiHandler` is a [Next.js API handler](https://nextjs.org/docs/api-routes/introduction) which takes a [request](https://developer.mozilla.org/en-US/docs/Web/API/Request) and [response](https://developer.mozilla.org/en-US/docs/Web/API/Response) object. This means that you can wrap the `createNextApiHandler` in any middleware you want.
