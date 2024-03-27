---
sidebar_position: 4
---

## First Steps

After scaffolding your project, here is some additional configuration to get your app up and running.

## Install Dependencies

We use pnpm in this repo so we recommend to use the same for your project. You can install it in your system in case you don't have it.

```bash
npm install -g pnpm
```

or

```bash
npm install -g @pnpm/exe
```

Then install the dependencies

```bash
pnpm i
```

## Environment Variables

There's am `.env.example` file in the root of the project. Copy it to `.env` and fill in the values.

```bash
cp .env.example .env
```

For the env validation we use [T3-env](https://env.t3.gg/). When you add new environment variables, you should add the validation in the `packages/auth/env.mjs` file to make sure your app always runs with the correct env variables.

## Databases

Modify the `schema.prisma` file to use sqlite or any other provider of your choice

```diff
#packages/db/prisma/schema.prisma
- provider = "postgresql"
+ provider = "sqlite"
```

Then push the prisma schema to your database

```bash
pnpm run db:push
```

## Configure Expo `dev`-script

#### Use iOS Simulator

1. Make sure you have XCode and XCommand Line Tools installed [as shown on expo docs](https://docs.expo.dev/workflow/ios-simulator/).

   **NOTE:** If you just installed XCode, or if you have updated it, you need to open the simulator manually once. Run `npx expo start` in the root dir, and then enter `I` to launch Expo Go. After the manual launch, you can run `pnpm dev` in the root directory.

```diff
 "dev": "expo start --ios",
```

2. Run `pnpm dev` at the project root folder.

**TIP:** It might be easier to run each app in separate terminal windows so you get the logs from each app separately. This is also required if you want your terminals to be interactive, e.g. to access the Expo QR code. You can run `pnpm --filter expo dev` and `pnpm --filter nextjs dev` to run each app in a separate terminal window.

#### For Android

1. Install Android Studio tools [as shown on expo docs](https://docs.expo.dev/workflow/android-studio-emulator/).
2. Change the `dev` script at `apps/expo/package.json` to open the Android emulator.

```diff
 "dev": "expo start --android",
```
