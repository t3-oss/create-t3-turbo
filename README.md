# create-t3-turbo

## Quick Start

To get it running, follow the steps below:

```
# Install dependencies
npm install

# Create a `.env` for prisma and make sure it's synced
echo DATABASE_URL=file:./db.sqlite >> packages/db/.env
npm run db-push

# Make sure your Expo dev-script is to your preference
# (Depends on which simulator you have - iOS or Android)

# Run!
npm run dev
```

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
 
