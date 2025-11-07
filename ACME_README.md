# README

The common [README.md](../README.md]) is the default from [t3 create turbo app](https://github.com/t3-oss/create-t3-turbo.git). Our goal is to have a custom template but still be able to pull the changes from t3. So we decided to NOT make any change to the files in t3, but just add new folder/files for this template. So this file exist to explain how we use this custom template to kick off an initial project.

This README includes setup instructions, but it's _very_ good context to read the t3 README, so please go ahead and do that, knowing that we will help you setup a new project with the customised instructions below. Then come back here.

If any any point the documentation is outdated or needs improvement, _obviously_, it's your responsibility to update it as you go through it, but feel free to ask how to overcome the issues you can't resolve.

## Setup

```sh
./scripts/setup.sh

# Update .env
# Update packages/auth/script/auth-cli.ts
```

## Development

```sh
pnpm format:fix
pnpm lint:fix
```

## Tests

* Colocate your tests with your production code
  * eg: `src/app/page.tsx` and `src/app/page.spec.tsx`
  * write _specs_ like: `it "renders stuff"` instead of `test("what")`

TODO: pg broken
TODO: wider linting airbnb etc
TODO: enforce specs with eslint
TODO: dbcleaner and factories?
TODO: GHA
TODO: Husky pre-commit
TODO: Mongo
TODO: Trunk?

### Resources

* https://vitest.dev/api/expect.html
* https://www.betterspecs.org - it's Ruby, but it's clear and simple

## Good dev

* Boyscout rule: leave things better than you found them (including this setup)
* Tests: if you fix a bug, you need to add testing, bugs tend to show up in the same logic

---

## Postgres

```sql
psql -U postgres -d postgres
create database acme1;
CREATE ROLE acme WITH LOGIN PASSWORD 'acmeacme1';
GRANT ALL PRIVILEGES ON DATABASE acme1 TO acme;
```

## Easy contributions

* packages/db/drizzle.config.ts `camelCase`??
* black 500 error

## WFT??

* Broken out of the box (see contributions)
* No tests setup?? no wonder it's broken
* DB tables in the package folder? setup for chaos BE logic duplication
* Instructions to setup the DB in the postgres DB, dirty dangerous
* `/script/` singular? folders should be plural
* White page 500 error, annoying
* No docker?
