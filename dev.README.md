# Dev Notes

The goal is to have a setup which uses payloadCMS as a data abstraction layer (db schema & calls, admin UI, auth) and allows consuming that data in a native app or website.

Ideally the website behaves like a true fast-performant website with server-rendered content and the app feels like a true native app with access to device features when necessary.

An minimum example use case would be an Instagram-like app that allows uploading images and following other users.

Since building websites with next.js + payload is a "solved issue", this project focuses on the more ambitious goal of creating a universal app whenever possible. This means the app is built in Expo Router and exports for web.

## Known issues

### Expo Router API routes

We would like to use an API route for trpc inside expo but API routes currently don't support ESM + dynamic imports which makes it impossible to load payload.

### Drizzle / Supabase

- Sometimes "Pull schema from database..." hangs until max connectsions reached. Not sure what causes it. Use `supabase db reset --linked`.
- Occasionally Turborepo Daemon can't start. `npx turbo daemon clean`

## Architecture decisions

1. Use Expo router and share as much code as possible between native app and web.

2. The Expo app fetches data client-side until something like RSC becomes available.

3. For Auth, first use payload's email/password flow, then add oAuth later.

4. Seperate it CMS admin and website and use trpc API endpoint in Next.js app.

5. Use Shadcn/ui (or [RN Reusables](https://github.com/mrzachnugent/react-native-reusables/))

6. Convert t3-turbo.gg template, then build something that better showcases Payload's features

7. Uses yarn instead of pnpm because less issues with React19 RC.

8. For blob storage use vercel. For emails loops.so.

## Resources

### Expo Router in Monorepo

Set `EXPO_USE_METRO_WORKSPACE_ROOT=1` so that Expo Router can find the entrypoint in the monorepo (See https://docs.expo.dev/guides/monorepos/#change-default-entrypoint)

### Auth

trpc + payload with auth: https://github.com/contentql/pin-hcms/blob/main/src/trpc/index.ts#L17

### Starter kit

react native starter kit with: nativewind, supabase auth, expo router, and react native reuseables https://github.com/a0m0rajab/rnr-base-bare/tree/master
