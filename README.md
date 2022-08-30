# create-t3-turbo

## Quick Start

To get it running, follow the steps below:

```shell
# Install dependencies
npm install

# Create a `.env` for prisma and make sure it's synced
echo DATABASE_URL=file:./db.sqlite >> packages/db/.env
npm run db-push
```

## iOS

Make sure you have XCode and XCommand Line Tools installed [as shown on expo docs](https://docs.expo.dev/workflow/ios-simulator/).
Then, change the `dev` script at `apps/expo/package.json` to open the iOS simulator.

```json
...
  "dev": "expo start --ios",
...
```

And run `npm run dev` at the project root folder.

## Android

Install Android Studio tools [as shown on expo docs](https://docs.expo.dev/workflow/android-studio-emulator/). 
After that, change the `dev` script at `apps/expo/package.json` to open the Android emulator.

```json
...
  "dev": "expo start --android",
...
```

And run `npm run dev` at the project root folder.

## Web

Run `npx expo install @expo/webpack-config@^0.17.0` at the project root folder. After that, change the `dev` script 
at `apps/expo/package.json` like shown bellow.

```json
...
  "dev": "expo start --web",
...
```

And run `npm run dev` at the project root folder.

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
 
