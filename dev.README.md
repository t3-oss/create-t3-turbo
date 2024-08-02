# Dev Notes

The goal is to have a setup which uses payloadCMS as a data abstraction layer (db schema & calls, admin UI, auth) and allows consuming that data in a native app or website.

Ideally the website behaves like a true fast-performant website with server-rendered content and the app feels like a true native app with access to device features when necessary.

An minimum example use case would be an Instagram-like app that allows uploading images and following other users.

Since building websites with next.js + payload is a "solved issue", this project focuses on the more ambitious goal of creating a universal app whenever possible. This means the app is built in expo / RN first and we'll try our best to make it work as a website too. The web version will likely suck for a while until universal RSC / Expo Router SSR becomes available but it is the most future compatible approach.

## Development

### Reset Supabase DB

`supabase db reset --linked`

## Architecture / Stack Questions

1. does the website need to share a lot of code, design and routes with native app?

   - PRO: support universal links, code sharing, we want to push the envelope here and eventually have only one app that runs everything
   - CON: could create least common denominator situation which limits both
   - YES: Solito, Expo Router v3, Expo for web, expo-next-adapter
   - NO: t3-turbo.gg, create 3 apps (expo, website, cms)

   > DECISION: Share code as much as possible to be future-facing. Don't use Solito but Expo Router v3+ which superseedes Solito.

2. does the native app fetch its data "on client" (as opposed to have mostly pre-generated content or server-side rendering)?

   - PRO: SOTA as of july '24, lots of examples, more flexibility
   - CON: makes interop with next SSR harder/impossible, type
   - YES: use trpc to fetch typed data from either Expo API route or Next.js/Payload API route
   - NO: wait for SSR rendering in Expo Router

   > DECISION: pre-generate routes statically using Expo Router and use dynamic routes for user profiles. Test if this supports API calls for mutations, how to handle auth and dynamic routes created at runtime (ie. `/user/[id]` after newly registered user). Wait for RSC to become available in Expo Router.

3. will it support oAuth?

   - PRO: off-load complexity to oAuth providers, less effort for users, more secure. Not sure Expo even supports something else?
   - CON: harder to implement perhaps, which ones to chose? Missing out on Payloads features and being independent of providers.
   - YES: follow t3-turbo example, use Expo recommended approach
   - NO: use payload v3 with passwords / email flow (maybe auth.js credentials provider?)

   > DECISION: first use payload's email/password flow as MVP, then add oAuth later.

4. is the CMS admin ui hosted seperately from the app?

   - PRO: seperation of concerns, easier to test/troubleshoot/deploy, keeping React/Next versions sep, technically the admin ui isn't needed (true headless mode), the CMS admin could eventually become its own app. No payloadv3/React19 headaches. Makes adopting the stack/template easier for others who just want to build a website (just delete the expo folder)
   - CON: yet another app/package to maintain, missing-out on advantage of having payload use next.js, problems can leak into each other (expo vs next vs payload)
   - YES: create a mono-repo with 2 apps (expo, cms) + 1 package (payload).
   - NO: install next+payload into expo dir and seperate admin UI from expo routes. Apply expo PR #30034.

   > DECISION: Yes, seperate it. Creat trpc API endpoint in CMS and use static output mode for web.

5. Do we use ShadCN/ui for UI?

   - PRO: universally loved, hot and sexy, I used it before, feels very native out of the box, accessibility features, highly customizable
   - CON: not sure react19 compatible, would create non-native feel to app design (can that even be avoided with RN?)

   > DECISION: use it for first version. if it creates problems, switch to something else.

## Templates

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
- Mostly concerned with routing, not data fetching or SSR yet
- the Future TM

## Known issues

### React versions

PayloadCMS v3 requires React19
Having 2 different react versions in the same project is an issue.
Expo is the bottle neck so far but this PR has been merged https://github.com/expo/expo/pull/30034
Use apply patch or wait for canary release?

### TRPC

crashes whenever its called
something related to api/trpc/[trpc]

## Resources

- trpc + payload with auth: https://github.com/contentql/pin-hcms/blob/main/src/trpc/index.ts#L17
- react native starter kit with: nativewind, supabase auth, expo router, and react native reuseables https://github.com/a0m0rajab/rnr-base-bare/tree/master
