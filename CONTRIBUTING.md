# Contributing to create-gmacko-app

Thanks for your interest in contributing! This document covers the development workflow and conventions for the monorepo.

## Prerequisites

- [Node.js](https://nodejs.org/) v22.21+
- [pnpm](https://pnpm.io/) v10.19+
- [Docker](https://www.docker.com/) (optional, for local PostgreSQL/Redis)

## Getting Started

```bash
# Clone the repo
git clone https://github.com/gmackie/create-gmacko-app.git
cd create-gmacko-app

# Install dependencies
pnpm install

# Copy env file and configure
cp .env.example .env

# Start local database (Option A: Docker)
docker compose up -d postgres

# Or use PGlite (Option B: zero dependencies)
# Set DATABASE_DRIVER=pglite in .env

# Push schema and seed
pnpm db:push
pnpm db:seed

# Start dev server
pnpm dev
```

## Monorepo Structure

```
apps/
  nextjs/          # Next.js web app
  expo/            # React Native mobile app
  tanstack-start/  # TanStack Start app
packages/
  api/             # tRPC API routers
  auth/            # Better Auth configuration
  db/              # Drizzle ORM schema & client
  ui/              # Shared UI components (shadcn)
  validators/      # Shared Zod schemas
  config/          # Feature flags & integration config
  email/           # Transactional email templates
  i18n/            # Internationalization
  logging/         # Structured logging (Pino)
  monitoring/      # Sentry integration
  analytics/       # PostHog analytics
  flags/           # Feature flag system
  jobs/            # Background job queue
  settings/        # App settings schemas
tooling/
  eslint/          # Shared ESLint config
  prettier/        # Shared Prettier config
  tailwind/        # Shared Tailwind config
  typescript/      # Shared tsconfig
  vitest/          # Shared Vitest config
```

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm dev:next` | Start Next.js only |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm lint:fix` | Lint and auto-fix |
| `pnpm format` | Check formatting |
| `pnpm format:fix` | Fix formatting |
| `pnpm typecheck` | Type-check all packages |
| `pnpm test` | Run unit tests |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm e2e:web` | Run Playwright E2E tests |
| `pnpm db:push` | Push schema to database |
| `pnpm db:generate` | Generate migration files |
| `pnpm db:migrate` | Run migrations |
| `pnpm db:seed` | Seed database |
| `pnpm db:studio` | Open Drizzle Studio |

## Branching Strategy

- `main` — production-ready, protected
- `feature/*` — feature branches, PR into main
- `fix/*` — bug fix branches
- `claude/*` — AI-assisted development branches

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add user onboarding flow
fix: correct subscription sync on webhook retry
docs: update deployment guide
chore: bump dependencies
refactor: extract pagination utility
test: add unit tests for organization router
```

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass
4. Open a PR with a description of what and why
5. CI will run lint, typecheck, test, and build automatically

## Adding a New Package

```bash
# Create the package directory
mkdir -p packages/my-package/src

# Add package.json, tsconfig.json
# Reference tooling/typescript for shared tsconfig
# Reference tooling/eslint for shared ESLint config
```

## Adding UI Components

```bash
# Uses shadcn to add components to @gmacko/ui
pnpm ui-add
```

## Database Changes

1. Modify `packages/db/src/schema.ts`
2. Generate migration: `pnpm db:generate`
3. Apply migration: `pnpm db:migrate`
4. Update seed data if needed: `packages/db/src/seed.ts`

## Testing

- Unit tests use [Vitest](https://vitest.dev/) with shared config from `tooling/vitest`
- E2E tests use [Playwright](https://playwright.dev/) for web, [Maestro](https://maestro.mobile.dev/) for mobile
- Place test files next to source: `my-file.ts` → `my-file.test.ts`

## Code Style

- Formatting is handled by Prettier (runs automatically via pre-commit hook)
- Linting uses ESLint with the shared `@gmacko/eslint-config`
- TypeScript strict mode is enabled across all packages
- Imports are auto-sorted by Prettier
