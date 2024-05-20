# packages/auth

## FAQ

### What's going on with `AUTH_URL` when running `pnpm dev`?

In order for certain auth features to work when developing locally (CSRF protection and redirects), the `AUTH_URL` needs to point to the NextJS app but through the IP address your expo dev server is listening on (the address is displayed in your Expo CLI when starting the dev server).

The `pnpm dev` command will try to infer the URL automatically, but it may not always work and you may get a different IP address and a different port. If that happens, you can always set it manually in your `.env` file or by setting it before the command, such as `AUTH_URL=http://x.x.x.x:x pnpm dev`.
