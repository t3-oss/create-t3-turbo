## Dev

### Pre-requisites

1. Create a Supabase account

https://supabase.com/dashboard/projects

and update the POSTGRES_URL in the .env file

You can get the DB connection string from: Supabase > Project > Home > Connect > ORMs > Change Prisma to Drizzle > .env

The below is an example of a working and testing DB string:

```
POSTGRES_URL="postgresql://postgres.<USER>:<PASSWORD>@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?workaround=supabase-pooler.vercel"
```

2. Create a Discord account and set up OAuth2

https://discord.com/developers/applications

Make sure to:

- Add `http://localhost:3000/api/auth/callback/discord` to the OAuth2 redirects in Discord
- Update the `AUTH_DISCORD_ID` and `AUTH_DISCORD_SECRET` variables in the .env file

4. .env file

`AUTH_SECRET` can be any string in development environment

5. [NVM (Node Version Manager)](https://github.com/nvm-sh/nvm)

```
nvm use
pnpm store prune
pnpm install
pnpm dev
```

## Connecting directly to the Supabase DB

Requires `brew install libpq`:

```
# Make sure to include `postgres.` as part of the username
psql -h aws-0-ap-southeast-2.pooler.supabase.com -U USERNAME -d postgres -p 5432
```

To list the databases when authenticated:

```
\d
```

## Troubleshooting

## error: relation "account" does not exist

Cause: The database schema hasn't been pushed to Supabase

Fix: Run `pnpm db:push` then restart the app
