---
sidebar_position: 4
---

Create T3 Turbo uses NativeWind and Tailwind CSS for styling. NativeWind uses Tailwind css as a scripting language to create a universal style system for your native application. On the next.js application, create t3 turbo uses tailwind css.

### Files

Let's look at how the different files are conifgured to allow you to use NativeWind and Tailwind CSS.

### `packages/config/tailwind/index.ts`

This is the tailwind configuration file. In here you configure your tailwind css. You can add plugins, extend the theme, and add variants. You can read more about tailwind configuration [here](https://tailwindcss.com/docs/configuration).

### `packages/config/tailwind/postcss.js`

In here we export the tailwindcss and autoprefixer plugins. You will probably don't need to edit this file for the majority of your project.

### `apps/expo/tailwind.config.ts`

In here, we import the base tailwind config and we configure tailwind to work on our expo application.

### `apps/expo/babel.config.js`

In here we register the nativewind and tailwindConfig plugins in the plugins array.

### `apps/nextjs/tailwind.config.ts`

In here we configure tailwind to work with our next.js application.
