# packages/api

## FAQ

### What's going on with `EXPO_PUBLIC_API_BASE_URL`?

The `EXPO_PUBLIC_API_BASE_URL` is needed to resolve Next.js' exposed API from Expo. This variable needs to be specified when building the app in production, and it should point the production deployment of the Next.js.

The `pnpm dev` command will try to infer the URL automatically, but it may not always work and you may get a different IP address and a different port. If that happens, you can always set it manually in your `.env` file or by setting it before the command, such as `EXPO_PUBLIC_API_BASE_URL=http://x.x.x.x:x pnpm dev`.
