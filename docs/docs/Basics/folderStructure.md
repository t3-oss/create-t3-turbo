---
sidebar_position: 3
---
In this template, we use `@acme` as a placeholder for package names. As a user, you might want to replace it with your own organization or project name. You can use find-and-replace to change all the instances of `@acme/` to something like `@my-company/` / `@project-name/`.

```
.github
  └─ workflows
        └─ CI with pnpm cache setup
.vscode
  └─ Recommended extensions and settings for VSCode users
apps
  ├─ expo
  |   ├─ Expo SDK 48
  |   ├─ React Native using React 18
  |   ├─ Navigation using Expo Router
  |   ├─ Tailwind using Nativewind
  |   └─ Typesafe API calls using tRPC
  └─ next.js
      ├─ Next.js 13
      ├─ React 18
      ├─ Tailwind CSS
      └─ E2E Typesafe API Server & Client
packages
 ├─ api
 |   └─ tRPC v10 router definition
 ├─ auth
     └─ authentication using next-auth. **NOTE: Only for Next.js app, not Expo**
 |─ config
     └─ contains configuration for eslint and tailwind css.
 └─ db
     └─ typesafe db-calls using Prisma
|─ .env.example
|─ .eslintrc.js
|─ .gitignore
|─ .npmrc
|─ .nvmrc
|─ LICENSE
|─ package.json
|─ pnpm-workspace.yaml
|─ pretter.config.cjs
|─ README.md
|─ renovate.json
|─ tsconfig.json
|─ turbo.json
|─ vercel.json
```


### `apps/expo`
The `apps/expo` directory contains the Expo app. It is powered by Expo SDK 48, React 18, Expo Router, Nativewind, and tRPC.

### `apps/next.js`
The `apps/next.js` directory contains the Next.js app. It is powered by Next.js 13, React 18, Tailwind CSS, and tRPC.

### `packages/api`
The `packages/api` directory contains the tRPC router definition. It uses tRPC v10. These router definitions are shared between the Next.js and Expo apps.

### `packages/config`
The `packages/config` directory contains the configuration for ESLint and Tailwind CSS used in the project.

### `packages/db`
The `packages/db` directory contains the Prisma client and the typesafe db-calls.

### `packages/auth`
The `packages/auth` directory contains the authentication logic for the Next.js app using next-auth. **NOTE: Only for Next.js app, not Expo**.
For authentication for your Expo app, you can look at [Clerk](https://clerk.com/), [Supabase Auth](https://supabase.com/docs/guides/auth), [Firebase Auth](https://firebase.google.com/docs/auth/) or [Auth0](https://auth0.com/docs). Note that if you're dropping the Expo app for something more "browser-like", you can still use Next-Auth.js for those. See an example in a Plasmo Chrome Extension [here](https://github.com/t3-oss/create-t3-turbo/tree/chrome/apps/chrome).

The Clerk.dev team even made an [official template repository](https://github.com/clerkinc/t3-turbo-and-clerk) integrating Clerk.dev with this repo.

During Launch Week 7, Supabase [announced their fork](https://supabase.com/blog/launch-week-7-community-highlights#t3-turbo-x-supabase) of this repo integrating it with their newly announced auth improvements. You can check it out [here](https://github.com/supabase-community/create-t3-turbo).

### `.env.example`
The `.env.example` file is used to provide an example of the environment variables that are required for the app to run. You should copy the file content to your own `.env` file and fill in the values. You can do it easily by running the following:

```bash
mv .env.example .env
```

### `.eslintrc.js`
The `.eslintrc.cjs` file is used to configure ESLint. See [ESLint Docs↗](https://eslint.org/docs/latest/use/configure/configuration-files) for more information.


### `.npmrc`
This file is a configuration file for NPM, it defines the settings on how NPM should behave when running commands. For more info check out the [pnpm docs](https://pnpm.io/npmrc).


### `.nvmrc`
The `.nvmrc` file specifies the Node.js version that should be used for the app. 


### LICENSE
The `LICENSE` file contains the license of the repo. This repo is licensed under the MIT license.

### `package.json`
The `package.json` file is used to configure the app and its dependencies. 

### `pnpm-workspace.yaml`
`pnpm-workspace.yaml` defines the root of the workspace and enables you to include / exclude directories from the workspace. By default, all packages of all subdirectories are included.

### `prettier.config.cjs`
The `prettier.config.cjs` file is used to configure Prettier to include the prettier-plugin-tailwindcss for formatting Tailwind CSS classes. See the Tailwind CSS [blog post↗](https://tailwindcss.com/blog/automatic-class-sorting-with-prettier) for more information.


### `README.md`
The `README.md` file contains instructions on how to quick set up the repo.

### `removate.json`
This monorepo uses renovate to keep dependencies up to date. The `renovate.json` file is used to configure renovate. See [Renovate Docs↗](https://docs.renovatebot.com/) for more information.


### `tsconfig.json`
The `tsconfig.json` file is used to configure TypeScript. Some non-defaults, such as `strict mode`, have been enabled to ensure the best usage of TypeScript for Create T3 Turbo and its libraries. See TypeScript [Docs↗](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html) for more information.


### `turbo.json`
The `turbo.json` file is used to configure Turbo. See [Turbo Docs↗](https://turbo.build/docs) for more information.

### `vercel.json`
The `vercel.json` file is used to configure Vercel. See [Vercel Docs↗](https://vercel.com/docs/configuration) for more information.