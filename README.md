# T3 Turbo x Supabase

![CleanShot 2023-04-11 at 23 42 53@2x](https://user-images.githubusercontent.com/51714798/231294720-1c64b391-4ecf-42d2-aad2-8c486c5d6bf5.png)

## About

This is an extended version of [create-t3-turbo](https://github.com/t3-oss/create-t3-turbo) implementing authentication using [Supabase Auth](https://supabase.com/docs/guides/auth) on both the web and mobile applications.

### Side note for mobile

**iOS:** One of the requirements for Apple's review process requires you to implement native `Sign in with Apple` if you're providing any other third party authentication method. Read more in [Section 4.8 - Design: Sign in with Apple](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple).

We have preconfigured this for you which you can find [here](./apps/expo/src/utils/auth.ts). All you need to do is to enable the Apple Provider in your [Supabase dashboard](https://app.supabase.com) and fill in your information.

> We currently only supports `Sign in with Apple` - support for more providers on mobile are being worked on!

## Quick Start

To get it running, follow the steps below:

### Setup dependencies

```diff
# Install dependencies
pnpm i

# Configure environment variables.
# There is an `.env.example` in the root directory you can use for reference
cp .env.example .env

# Push the Prisma schema to your database
# Can't run with Turbo as we need an interactive shell (see below why)
# Consequent runs you may simply do `pnpm db:push` from root.
pnpm -F db db:push
```

> When running the last command, `pnpm -F db db:push`, you'll get a warning for adding a unique constraint on the `schema-migrations` model. This is because Supabase doesn't include this by default, but Prisma requires each model to have at least one unique column. You can safely accept this warning and add the unique constraint on the table.

### Setting up Supabase

1. Go to [the Supabase dashboard](https://app.supabase.com/projects) and create a new project.
2. Under project settings, retrieve the environment variables `reference id`, `project url` & `anon public key` and paste them into [.env](./.env.example) and [apps/expo/.env](./apps/expo/.env.example) in the necessary places. You'll also need the database password you set when creating the project.
3. Under `Auth`, configure any auth provider(s) of your choice. This repo is using Github for Web and Apple for Mobile.

By default, Supabase exposes the `public` schema to the PostgREST API to allow the `supabase-js` client query the database directly from the client. However, since we route all our requests through the Next.js application (through tRPC), we don't want our client to have this access. To disable this, execute the following SQL query in the SQL Editor on your Supabase dashboard:

```sql
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;
```

![disable public access](https://user-images.githubusercontent.com/51714798/231810706-88b1db82-0cfd-485f-9043-ef12a53dc62f.png)

> Note: This means you also don't need to enable row-level security (RLS) on your database if you don't want to.

### Configure Expo `dev`-script

#### Use iOS Simulator

1. Make sure you have XCode and XCommand Line Tools installed [as shown on expo docs](https://docs.expo.dev/workflow/ios-simulator/).
   > **NOTE:** If you just installed XCode, or if you have updated it, you need to open the simulator manually once. Run `npx expo start` in the root dir, and then enter `I` to launch Expo Go. After the manual launch, you can run `pnpm dev` in the root directory.

```diff
+  "dev": "expo start --ios",
```

3. Run `pnpm dev` at the project root folder.

> **TIP:** It might be easier to run each app in separate terminal windows so you get the logs from each app separately. This is also required if you want your terminals to be interactive, e.g. to access the Expo QR code. You can run `pnpm --filter expo dev` and `pnpm --filter nextjs dev` to run each app in a separate terminal window.

#### For Android

1. Install Android Studio tools [as shown on expo docs](https://docs.expo.dev/workflow/android-studio-emulator/).
2. Change the `dev` script at `apps/expo/package.json` to open the Android emulator.

```diff
+  "dev": "expo start --android",
```

3. Run `pnpm dev` at the project root folder.

## References

- For more useful information on how to deploy this stack, refer to [t3-oss/create-t3-turbo](https://github.com/t3-oss/create-t3-turbo).
- [Supabase Documentation](https://supabase.com/docs)
- This stack originates from [create-t3-app](https://github.com/t3-oss/create-t3-app).
- A [blog post](https://jumr.dev/blog/t3-turbo) where I wrote how to migrate a T3 app into this.
