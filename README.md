# create-t3-turbo

## Installation

> [!NOTE]
>
> Make sure to follow the system requirements specified in [`package.json#engines`](./package.json#L4) before proceeding.

You can use this repository as a template or init via Turbo's CLI (use PNPM as package manager):

```bash
npx create-turbo@latest -e https://github.com/t3-oss/create-t3-turbo
```

## About

A monorepo starter for T3 apps powered by [Turborepo](https://turborepo.com).

```text
.github
  └─ workflows
        └─ CI with pnpm cache setup
.vscode
  └─ Recommended extensions and settings for VSCode users
apps
  ├─ mobile
  │   ├─ Expo SDK 54
  │   ├─ React Native 0.81 using React 19
  │   ├─ Navigation using Expo Router
  │   ├─ Tailwind CSS v4 using NativeWind v5
  │   └─ Typesafe API calls using tRPC
  └─ web
      ├─ TanStack Start v1
      ├─ React 19
      ├─ Vite 7 with Rolldown bundler
      ├─ Tailwind CSS v4
      └─ E2E Typesafe API Server & Client
packages
  ├─ api
  │   └─ tRPC v11 router definition
  ├─ auth
  │   └─ Authentication using better-auth
  ├─ db
  │   └─ Typesafe db calls using Drizzle & Supabase
  └─ ui
      └─ Shared UI package using shadcn-ui
tooling
  ├─ oxc (via root .oxlintrc.json)
  │   └─ oxlint for linting, oxfmt for formatting
  ├─ tailwind
  │   └─ shared tailwind theme and configuration
  └─ typescript
      └─ shared tsconfig you can extend from
```

> In this template, we use `@acme` as a placeholder for package names. As a user, you might want to replace it with your own organization or project name. You can use find-and-replace to change all the instances of `@acme` to something like `@my-company` or `@project-name`.

## Quick Start

> **Note**
> The [db](./packages/db) package is preconfigured to use Supabase and is **edge-bound** with the [Vercel Postgres](https://github.com/vercel/storage/tree/main/packages/postgres) driver. If you're using something else, make the necessary modifications to the [schema](./packages/db/src/schema.ts) as well as the [client](./packages/db/src/index.ts) and the [drizzle config](./packages/db/drizzle.config.ts). If you want to switch to non-edge database driver, remove `export const runtime = "edge";` [from all pages and api routes](https://github.com/t3-oss/create-t3-turbo/issues/634#issuecomment-1730240214).

To get it running, follow the steps below:

### 1. Setup dependencies

```bash
# Install dependencies
pnpm i

# Configure environment variables
# There is an `.env.example` in the root directory you can use for reference
cp .env.example .env

# Push the Drizzle schema to the database
pnpm db:push
```

### 2. Generate Better Auth Schema

This project uses [Better Auth](https://www.better-auth.com) for authentication. The auth schema needs to be generated using the Better Auth CLI before you can use the authentication features.

```bash
# Generate the Better Auth schema
pnpm --filter @acme/auth generate
```

This command runs the Better Auth CLI with the following configuration:

- **Config file**: `packages/auth/script/auth-cli.ts` - A CLI-only configuration file (isolated from src to prevent imports)
- **Output**: `packages/db/src/auth-schema.ts` - Generated Drizzle schema for authentication tables

The generation process:

1. Reads the Better Auth configuration from `packages/auth/script/auth-cli.ts`
2. Generates the appropriate database schema based on your auth setup
3. Outputs a Drizzle-compatible schema file to the `@acme/db` package

> **Note**: The `auth-cli.ts` file is placed in the `script/` directory (instead of `src/`) to prevent accidental imports from other parts of the codebase. This file is exclusively for CLI schema generation and should **not** be used directly in your application. For runtime authentication, use the configuration from `packages/auth/src/index.ts`.

For more information about the Better Auth CLI, see the [official documentation](https://www.better-auth.com/docs/concepts/cli#generate).

### 3. Configure Expo `dev`-script

#### Use iOS Simulator

1. Make sure you have XCode and XCommand Line Tools installed [as shown on expo docs](https://docs.expo.dev/workflow/ios-simulator).

   > **NOTE:** If you just installed XCode, or if you have updated it, you need to open the simulator manually once. Run `npx expo start` from `apps/mobile`, and then enter `I` to launch Expo Go. After the manual launch, you can run `pnpm dev` in the root directory.

   ```diff
   +  "dev": "expo start --ios",
   ```

2. Run `pnpm dev` at the project root folder.

#### Use Android Emulator

1. Install Android Studio tools [as shown on expo docs](https://docs.expo.dev/workflow/android-studio-emulator).

2. Change the `dev` script at `apps/mobile/package.json` to open the Android emulator.

   ```diff
   +  "dev": "expo start --android",
   ```

3. Run `pnpm dev` at the project root folder.

### 4. Configuring Better-Auth to work with Expo

In order to get Better-Auth to work with Expo, you must either:

#### Deploy the web app (RECOMMENDED)

By deploying the TanStack Start app (`apps/web`), you get a stable public URL for OAuth redirects that works across preview deployments and development for the mobile app.

#### Add your local IP to your OAuth provider

You can alternatively add your local IP (e.g. `192.168.x.y:$PORT`) to your OAuth provider. This may not be as reliable as your local IP may change when you change networks.

### 5a. When it's time to add a new UI component

Run the `ui-add` script to add a new UI component using the interactive `shadcn/ui` CLI:

```bash
pnpm ui-add
```

When the component(s) has been installed, you should be good to go and start using it in your app.

### 5b. When it's time to add a new package

To add a new package, simply run `pnpm turbo gen init` in the monorepo root. This will prompt you for a package name as well as if you want to install any dependencies to the new package (of course you can also do this yourself later).

The generator sets up the `package.json`, `tsconfig.json` and a `index.ts`, as well as configures all the necessary configurations for tooling around your package such as formatting, linting and typechecking. When the package is created, you're ready to go build out the package.

## FAQ

### Does the starter include Solito?

No. Solito will not be included in this repo. It is a great tool if you want to share code between your web and mobile app. However, the main purpose of this repo is the code splitting of your T3 App into a monorepo. The mobile app is just a bonus example of how you can utilize the monorepo with multiple apps.

### Does this pattern leak backend code to my client applications?

No, it does not. The `api` package should only be a production dependency in the web application where it's served. The mobile app, and all other apps you may add in the future, should only add the `api` package as a dev dependency. This lets you have full typesafety in your client applications, while keeping your backend code safe.

If you need to share runtime code between the client and server, such as input validation schemas, you can create a separate `shared` package for this and import it on both sides.

## Deployment

### TanStack Start (`apps/web`)

Deploy the `apps/web` app to any hosting provider that supports Node.js. For Vercel:

1. Create a new project on Vercel, select `apps/web` as the root directory.
2. Add your `POSTGRES_URL` environment variable.
3. Done! Your app should successfully deploy.

### Expo / Mobile (`apps/mobile`)

Deploying your Expo application works slightly differently compared to web apps. Instead of "deploying" your app online, you need to submit production builds of your app to app stores, like [Apple App Store](https://www.apple.com/app-store) and [Google Play](https://play.google.com/store/apps). You can read the full [guide to distributing your app](https://docs.expo.dev/distribution/introduction), including best practices, in the Expo docs.

1. Make sure to modify the `getBaseUrl` function to point to your backend's production URL:

   <https://github.com/t3-oss/create-t3-turbo/blob/656965aff7db271e5e080242c4a3ce4dad5d25f8/apps/expo/src/utils/api.tsx#L20-L37>

2. Let's start by setting up [EAS Build](https://docs.expo.dev/build/introduction), which is short for Expo Application Services. The build service helps you create builds of your app, without requiring a full native development setup. The commands below are a summary of [Creating your first build](https://docs.expo.dev/build/setup).

   ```bash
   # Install the EAS CLI
   pnpm add -g eas-cli

   # Log in with your Expo account
   eas login

   # Configure your Expo app
   cd apps/mobile
   eas build:configure
   ```

3. After the initial setup, you can create your first build. You can build for Android and iOS platforms and use different [`eas.json` build profiles](https://docs.expo.dev/build-reference/eas-json) to create production builds or development, or test builds. Let's make a production build for iOS.

   ```bash
   eas build --platform ios --profile production
   ```

   > If you don't specify the `--profile` flag, EAS uses the `production` profile by default.

4. Now that you have your first production build, you can submit this to the stores. [EAS Submit](https://docs.expo.dev/submit/introduction) can help you send the build to the stores.

   ```bash
   eas submit --platform ios --latest
   ```

   > You can also combine build and submit in a single command, using `eas build ... --auto-submit`.

5. Before you can get your app in the hands of your users, you'll have to provide additional information to the app stores. This includes screenshots, app information, privacy policies, etc. _While still in preview_, [EAS Metadata](https://docs.expo.dev/eas/metadata) can help you with most of this information.

6. Once everything is approved, your users can finally enjoy your app. Let's say you spotted a small typo; you'll have to create a new build, submit it to the stores, and wait for approval before you can resolve this issue. In these cases, you can use EAS Update to quickly send a small bugfix to your users without going through this long process. Let's start by setting up EAS Update.

   The steps below summarize the [Getting started with EAS Update](https://docs.expo.dev/eas-update/getting-started/#configure-your-project) guide.

   ```bash
   # Add the `expo-updates` library to your Expo app
   cd apps/mobile
   pnpm expo install expo-updates

   # Configure EAS Update
   eas update:configure
   ```

7. Before we can send out updates to your app, you have to create a new build and submit it to the app stores. For every change that includes native APIs, you have to rebuild the app and submit the update to the app stores. See steps 2 and 3.

8. Now that everything is ready for updates, let's create a new update for `production` builds. With the `--auto` flag, EAS Update uses your current git branch name and commit message for this update. See [How EAS Update works](https://docs.expo.dev/eas-update/how-eas-update-works/#publishing-an-update) for more information.

   ```bash
   cd apps/mobile
   eas update --auto
   ```

   > Your OTA (Over The Air) updates must always follow the app store's rules. You can't change your app's primary functionality without getting app store approval. But this is a fast way to update your app for minor changes and bug fixes.

9. Done! Now that you have created your production build, submitted it to the stores, and installed EAS Update, you are ready for anything!

## References

The stack originates from [create-t3-app](https://github.com/t3-oss/create-t3-app).

A [blog post](https://jumr.dev/blog/t3-turbo) where I wrote how to migrate a T3 app into this.
