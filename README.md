# create-t3-turbo

## About

Ever wondered how to migrate your T3 application into a monorepo? Stop right here! This is the perfect starter repo to get you running with the perfect stack!

It uses [Turborepo](https://turborepo.org/) and contains:

```
apps
 |- expo
     |- Expo SDK 46
     |- React Native using React 18
     |- Tailwind using Nativewind
     |- Typesafe API calls using tRPC
 |- next.js
     |- React 18
     |- TailwindCSS
     |- E2E Typesafe API Server & Client
packages
 |- api
     |- tRPC v10 router definition
 |- db
     |- typesafe db-calls using Prisma
 ```

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

 ## Deployment

 ### Next.js

 #### Prerequisites

 _We do not recommend deploying a SQLite database on serverless environments since the data wouldn't be persisted. I provisioned a quick Postgresql database on [Railway](https://railway.app), but you can of course use any other database provider. Make sure the prisma schema is updated to use the correct database._

#### Deploy to Vercel

 Let's deploy the Next.js application to [Vercel](https://vercel.com/). If you have ever deployed a Turborepo app there, the steps are quite straightforward. You can also read the [official Turborepo guide](https://vercel.com/docs/concepts/monorepos/turborepo) on deploying to Vercel.

1. Create a new project on Vercel, select the `apps/nextjs` folder as the root directory and apply the following build settings:
    <img width="907" alt="CleanShot 2022-09-03 at 22 51 25@2x" src="https://user-images.githubusercontent.com/51714798/188287309-e6ff4cb9-827a-4e50-83ed-e0953d7752f9.png">

2. Add your `DATABASE_URL` environment variable.

3. Done! Your app should successfully deploy. Assign your domain and use that instead of `localhost` for the `url` in the Expo app so that your Expo app can communicate with your backend when you are not in development.

 ### Expo

 _**TODO:** Feel free to PR a guide for this. Refer to the Expo docs:_
 - _[Creating your first build](https://docs.expo.dev/build/setup/)_
 - _[Getting started with EAS Update](https://docs.expo.dev/eas-update/getting-started/)_

 ## References
 The stack originates from [create-t3-app](https://github.com/t3-oss/create-t3-app).
 
 A [blog post](https://jumr.dev/blog/t3-turbo) where I wrote how to migrate a T3 app into this. 
 
