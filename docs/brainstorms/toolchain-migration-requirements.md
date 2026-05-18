# Toolchain Migration Requirements

**Date:** 2026-05-17
**Status:** Ready for implementation

## Goal

Migrate the monorepo toolchain: replace ESLint+Prettier with OXC lint+fmt, adopt Vite 7 Rolldown bundler, drop the NextJS app, rename the two remaining apps, and upgrade Turbo and pnpm.

## Scope

### 1. Replace ESLint + Prettier with OXC

- **Remove** `tooling/eslint/` package entirely
- **Remove** `tooling/prettier/` package entirely
- **Add** `tooling/oxc/` package with shared OXC lint + fmt config
- Replace all `eslint.config.ts` files with OXC lint config (`.oxlintrc.json` or `oxlint.json`)
- Update all `lint` scripts: `eslint ...` → `oxlint ...`
- Update all `format` scripts: `prettier ...` → `oxc fmt`
- Drop `eslint`, `prettier`, `@acme/eslint-config`, `@acme/prettier-config` from every `package.json`
- Add `oxlint` and OXC formatter to each package that needs it
- Drop `eslint`/`prettier` catalog entries from `pnpm-workspace.yaml`, add OXC entries
- Update `turbo.json`: format cache output `.cache/.prettiercache` → OXC equivalent
- Remove `publicHoistPattern` entries for prettier plugins from `pnpm-workspace.yaml`
- Remove `@ianvs/prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`
- Remove `prettier` field from all `package.json` files

### 2. Migrate to Vite 7 + Rolldown

`vite: 7.1.12` is already pinned in the catalog — this is a config-level migration, not a version bump.

- Follow https://v7.vite.dev/guide/rolldown for migration steps
- Enable Rolldown bundler in `apps/web/vite.config.ts` (explicit opt-in, e.g. `experimental.enableNativePlugin` or switch to `rolldown-vite` package per the guide)
- Replace any `build.rollupOptions` with `build.rolldownOptions` where Rolldown-specific config is needed
- Audit plugin compatibility: `@vitejs/plugin-react` 5.1.0, `@tailwindcss/vite`, `vite-tsconfig-paths`, `nitro` — flag any incompatible Rollup plugins
- Confirm `@tanstack/react-start/plugin/vite` supports Rolldown; document as a blocker if not
- Reference: https://v7.vite.dev/guide/rolldown

### 3. Remove NextJS app

- **Delete** `apps/nextjs/` directory
- Remove `dev:next` script from root `package.json`
- Remove `@next/eslint-plugin-next` from any remaining config
- Drop `next`-related catalog entries if unused elsewhere

### 4. Rename apps

| From | To | Package name |
|---|---|---|
| `apps/expo/` | `apps/mobile/` | `@acme/expo` → `@acme/mobile` |
| `apps/tanstack-start/` | `apps/web/` | `@acme/tanstack-start` → `@acme/web` |

Update all cross-references (root scripts, turbo filters, README, any workspace deps).

### 5. Upgrade Turbo to 2.9.14

- Update `turbo` and `@turbo/gen` in root `package.json` devDependencies
- Review `turbo.json` for breaking changes between 2.5.8 → 2.9.14
- Reference: https://github.com/vercel/turborepo/releases

### 6. Upgrade pnpm to 11

- Update `packageManager` field: `pnpm@10.19.0` → `pnpm@11.x`
- Update `engines.pnpm` constraint in root `package.json`
- Review pnpm 11 breaking changes (workspace protocol, hoisting defaults)
- Reference: https://pnpm.io/blog/releases/11.0

### 7. Update README

- Remove all NextJS references (app listing, stack description, scripts)
- Update app names: expo → mobile, tanstack-start → web
- Update directory tree
- Update any links pointing to renamed paths
- Reference Rolldown as the bundler for `apps/web`

## Out of scope

- Changing any app logic, components, or business code
- Adding new features
- Migrating TypeScript config

## Success criteria

- `pnpm lint` runs oxlint across all workspaces with no errors
- `pnpm format` runs OXC formatter across all workspaces
- `pnpm build` succeeds for `@acme/web` and `@acme/mobile` using Rolldown
- `apps/nextjs/` no longer exists
- `apps/web/` and `apps/mobile/` exist with correct package names
- No `eslint` or `prettier` references remain in any `package.json`
