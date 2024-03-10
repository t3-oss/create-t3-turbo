# Auth Proxy

This is a simple proxy server that enables OAuth authentication for preview environments.

## Setup

Deploy it somewhere (Vercel is a one-click, zero-config option) and set the following environment variables:

- `AUTH_DISCORD_ID` - The Discord OAuth client ID
- `AUTH_DISCORD_SECRET` - The Discord OAuth client secret
- `AUTH_REDIRECT_PROXY_URL` - The URL of this proxy server
- `AUTH_SECRET` - Your secret

Make sure the `AUTH_SECRET` and `AUTH_REDIRECT_PROXY_URL` match the values set for the main application's deployment for preview environments, and that you're using the same OAuth credentials for the proxy and the application's preview environment.
`AUTH_REDIRECT_PROXY_URL` should only be set for the main application's preview environment. Do not set it for the production environment.
The lines below shows what values should match eachother in both deployments.

![Environment variables setup](https://github.com/t3-oss/create-t3-turbo/assets/51714798/5fadd3f5-f705-459a-82ab-559a3df881d0)

For providers that require an origin and a redirect URL, set them to `{AUTH_REDIRECT_PROXY_URL}` and `{AUTH_REDIRECT_PROXY_URL}/callback/{provider}` accordingly.

![Google credentials setup](https://github.com/ahkhanjani/create-t3-turbo/assets/72540492/eaa88685-6fc2-4c23-b7ac-737eb172fa0e)
