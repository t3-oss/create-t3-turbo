# Building the App

## Start by Setting up Expo Updates

The steps below summarize the [Getting started with EAS Update guide](https://docs.expo.dev/eas-update/getting-started/#configure-your-project). This allows us to deploy new JS to the application without going through build, submission and approval process each time.

```bash
# Add the `expo-updates` library to your Expo app
cd apps/expo
pnpm expo install expo-updates

# Configure EAS Update
eas update:configure
```

## Set up EAS Builds

Next we can set up EAS builds.
