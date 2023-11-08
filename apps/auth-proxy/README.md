# Auth Proxy

This is a simple proxy server that enables OAuth authentication for preview environments.

## Setup

Deploy it somewhere (Vercel is a one-click, zero-config option) and set the following environment variables:

- `AUTH_DISCORD_ID` - The Discord OAuth client ID
- `AUTH_DISCORD_SECRET` - The Discord OAuth client secret
- `AUTH_REDIRECT_PROXY_URL` - The URL of this proxy server
- `AUTH_SECRET` - Your secret

Make sure the `AUTH_SECRET` and `AUTH_REDIRECT_PROXY_URL` match the values set for the main application's deployment for preview environments:

![Environment variables setup](https://github.com/t3-oss/create-t3-turbo/assets/51714798/ebff3911-b7bb-4adf-98bb-2c520609ad8e)
