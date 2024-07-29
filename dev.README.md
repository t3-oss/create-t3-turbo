# Dev Notes

The goal is to have a setup which uses payloadCMS as a data abstraction layer (db schema & calls, admin UI, auth) and allows consuming that data in a native app or website.

Ideally the website behaves like a true fast-performant website with server-rendered content and the app feels like a true native app with access to device features when necessary.

An minimum example use case would be an Instagram-like app that allows uploading images and following other users.

## Architecture / Stack

### Questions

1. does the website need to share a lot of code, design and routes with native app?

   - PRO: support universal links, code sharing, we want to push the envelope here and eventually have only one app that runs everything
   - CON: creates least common denominator situation which limits both
   - YES: Solito, Expo Routes + reactive native web
   - NO: t3-turbo.gg, create 3 apps (expo, website, cms)

2. does the native app fetch its data "on client" (as opposed to have mostly pre-generated content or server-side rendering)?

   - PRO: SOTA as of july '24, lots of examples, more flexibility
   - CON: makes interop with next SSR harder/impossible, type
   - YES: use trpc to fetch typed data from either Expo API route or Next.js/Payload API route
   - NO: wait for SSR rendering in Expo Router

3. will it support oAuth?

   - PRO: off-load complexity to oAuth providers, less effort for users, more secure
   - CON: harder to implement perhaps, which ones to chose?
   - YES: follow t3-turbo example
   - NO: use payload v3 with passwords / email flow

4. is the CMS admin ui hosted seperately from the app?

   - PRO: seperation of concerns, easier to test/troubleshoot/deploy, keeping React/Next versions sep, technically the admin ui isn't needed (true headless mode), the CMS admin could eventually become its own app. No payloadv3/React19 headaches. Makes adopting the stack/template easier for others who just want to build a website (just delete the expo folder)
   - CON: yet another app/package to maintain, missing-out on advantage of having payload use next.js, problems can leak into each other (expo vs next vs payload)
   - YES: create a mono-repo with 2 apps (expo, cms) + 1 package (payload).
   - NO: install next+payload into expo dir and seperate admin UI from expo routes. Apply expo PR #30034.

### t3-turbo.gg

- oppinionated with respect to PNPM, Drizzle, OAuth, Shadcn/ui, not using react native web (would not use any of them)
- well-laid out wrt turborepo, packages, validation tools

Is the mono repo even needed when Payload runs everything for us? Why not install next+payload into expo?

### Solito

- adds isomorphic objects for navigation & animations but with the cost of non-standard API names
- seems not soo up-to-date / only one person behind it. created bofore Next.js App Router / Expo Router v3
- maybe unnecessary with Expo Router v3 and soon universal react server components

### Expo Router v3 (v4?)

- Inspired by Next/Solito
- Mostly concerned with routing, not data fetching
-

## Known issues

### React versions

PayloadCMS v3 requires React19
Having 2 different react versions in the same project is an issue.
Expo is the bottle neck so far but this PR has been merged https://github.com/expo/expo/pull/30034
Use apply patch or wait for canary release?

### TRPC

crashes whenever its called
something related to api/trpc/[trpc]
