---
sidebar_position: 3
---

Create T3 Turbo uses expo router to make it easier to scale and maintain your application with file base routing. Every file in the `app` directory will be automatically become a route in your mobile navigation. Expo router also supports dynamic routes with the `[id].tsx` file convention. You can visit the [Expo Router Docs](https://expo.github.io/router/docs) to learn more.

## Files

Expo router requires a few files to be present in your project to work. These files are:

### `apps/expo/index.tsx`

This is the entry point of expo router. Here, we configure our app and export the `ExpoRoot` from expo-router to allow fast refresh to update the context.

### `apps/expo/_layout.tsx`

This is the root layout of the application. You define the different components that are shared across the entire screens of the application. You also define different contexts such as the `TRPCProvider` and other providers needed in your application.

### `apps/expo/package.json`

In here, you need to delete the entry point or replace it with `index.tsx`.

```javascript
{
    "main": "index.tsx",
    ...
}
```

### `apps/expo/babel.config.js`

Here we register the expo-router babel plugin in the list of plugins in the babel config file.
