# create-t3-turbo

## Quick Start

To get it running, follow the steps below:

### Setup dependencies
```shell
# Install dependencies
npm install

# Create a `.env` for prisma and make sure it's synced
echo DATABASE_URL=file:./db.sqlite >> packages/db/.env
npm run db-push
```

### Configure Expo `dev`-script

> **Note:** If you want to use a physical phone with Expo Go, just run `npm run dev` and scan the QR-code.

#### Use iOS Simulator

1. Make sure you have XCode and XCommand Line Tools installed [as shown on expo docs](https://docs.expo.dev/workflow/ios-simulator/).
2. Change the `dev` script at `apps/expo/package.json` to open the iOS simulator.

```diff
+  "dev": "expo start --ios",
```

3. Run `npm run dev` at the project root folder.

#### For Android

1. Install Android Studio tools [as shown on expo docs](https://docs.expo.dev/workflow/android-studio-emulator/). 
2. Change the `dev` script at `apps/expo/package.json` to open the Android emulator.

```diff
+  "dev": "expo start --android",
```

3. Run `npm run dev` at the project root folder.

## About

Ever wondered how to migrate your T3 application into a monorepo? Stop right here! This is the perfect starter repo to get you running with the perfect stack!

It uses [Turborepo](https://turborepo.org/) and contains:

```
apps
 |- expo
     |- Expo SDK 46
     |- React Native using React 18
     |- Tailwind using Nativewind
     |- Typesafe API Calls using tRPC
 |- next.js
     |- React 18
     |- TailwindCSS
     |- E2E Typesafe API Server & Client
packages
 |- api
     |- tRPC router definition
 |- db
     |- typesafe db-calls using Prisma
 ```
 
 ## References
 The stack originates from [create-t3-app](https://github.com/t3-oss/create-t3-app).
 
 A [blog post](https://jumr.dev/blog/t3-turbo) where I wrote how to migrate a T3 app into this. 
 
