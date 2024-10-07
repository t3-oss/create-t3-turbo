---
sidebar_position: 2
---

There are two ways of inititializing the app with `create-t3-turbo`. The first one is by cloning this repo, and the second one is by using the Turbo's CLI to init your project.

## By cloning the repo
    
```bash
git clone https://github.com/t3-oss/create-t3-turbo.git
```

## Using the Turbo's CLI

### npm

```bash
npx create-turbo@latest -e https://github.com/t3-oss/create-t3-turbo
```

### pnpm
    
```bash
pnpm dlx create-turbo@latest -e https://github.com/t3-oss/create-t3-turbo
```    

This will create a monorepo powered by [Turborepo](https://turbo.build/repo). It contains react native with expo, nextjs, prisma, and trpc. Turborepo will cache locally by default. For an additional speed boost, enable Remote Caching with Vercel by
entering the following command:

```bash
pnpm dlx turbo login
```
