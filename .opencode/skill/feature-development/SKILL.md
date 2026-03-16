---
name: feature-development
description: Implement full-stack features with database, API, web UI, and mobile UI
---

# Feature Development Skill

Use this skill when implementing full-stack features in the create-gmacko-app template. This is the **orchestration skill** — it coordinates the specialized skills for a complete workflow.

## Related Skills

| Skill | When to Use |
|-------|-------------|
| **spec-driven-development** | Before coding — gather requirements and write acceptance criteria |
| **api-first-development** | Building the API layer with shared validators and tRPC |
| **performance** | Adding prefetching, Suspense, optimistic updates, and polish |
| **testing** | Writing unit, integration, and E2E tests against the spec |
| **saas-compliance** | Adding audit logging, security headers, and SOC2 controls |
| **frontend-development** | Building UI with shadcn/ui and NativeWind |

## Complete Workflow

### Phase 1: Specification (→ spec-driven-development)

**Never start coding without a clear spec.** If the user's request is vague:

1. Ask clarifying questions (data model, permissions, platforms, edge cases)
2. Write a structured specification with acceptance criteria
3. Get user approval before proceeding

```
User says: "Add a comments feature"
You respond: Ask 5-7 clarifying questions, then write the spec
```

### Phase 2: Data Model

If your feature needs new data:

```typescript
// packages/db/src/schema.ts
import { pgTable } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const yourTable = pgTable("your_table", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t.text().notNull().references(() => user.id, { onDelete: "cascade" }),
  title: t.varchar({ length: 256 }).notNull(),
  status: t.varchar({ length: 20 }).notNull().default("active"),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t.timestamp({ mode: "date", withTimezone: true }).$onUpdateFn(() => sql`now()`),
}));
```

Create shared validators in the validators package:

```typescript
// packages/validators/src/your-feature.ts
import { z } from "zod/v4";

export const CreateYourFeatureSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
});

export const UpdateYourFeatureSchema = CreateYourFeatureSchema.partial();

export type CreateYourFeatureInput = z.infer<typeof CreateYourFeatureSchema>;
```

After schema changes:

```bash
pnpm db:push       # Apply to remote/Docker database
pnpm db:push:local # Apply to local PGlite database
```

### Phase 3: API Layer (→ api-first-development)

Build the API first with shared validators. The tRPC router is the single source of truth consumed by both web and mobile.

```typescript
// packages/api/src/router/your-feature.ts
import { eq } from "@gmacko/db";
import { yourTable } from "@gmacko/db/schema";
import { CreateYourFeatureSchema } from "@gmacko/validators/your-feature";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const yourFeatureRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(yourTable).orderBy(desc(yourTable.createdAt));
  }),

  create: protectedProcedure
    .input(CreateYourFeatureSchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(yourTable)
        .values({ userId: ctx.session.user.id, ...input })
        .returning();
      return created;
    }),
});
```

Add to root router:

```typescript
// packages/api/src/root.ts
import { yourFeatureRouter } from "./router/your-feature";

export const appRouter = createTRPCRouter({
  // ... existing routers
  yourFeature: yourFeatureRouter,
});
```

### Phase 4: Web UI (→ performance, → frontend-development)

Every page MUST use server-side prefetching and Suspense boundaries:

```typescript
// apps/nextjs/src/app/your-feature/page.tsx
import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { YourFeatureList, YourFeatureListSkeleton } from "./_components/list";
import { CreateForm } from "./_components/create-form";

export default function YourFeaturePage() {
  // ✅ Prefetch on the server — zero client-side loading
  prefetch(trpc.yourFeature.list.queryOptions());

  return (
    <HydrateClient>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Your Feature</h1>
        <CreateForm />
        <Suspense fallback={<YourFeatureListSkeleton />}>
          <YourFeatureList />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
```

Client components consume prefetched data via `useSuspenseQuery`:

```typescript
// apps/nextjs/src/app/your-feature/_components/list.tsx
"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

export function YourFeatureList() {
  const trpc = useTRPC();
  const { data: items } = useSuspenseQuery(trpc.yourFeature.list.queryOptions());

  if (items.length === 0) {
    return <EmptyState message="No items yet. Create your first one!" />;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <YourFeatureCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function YourFeatureListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border p-4">
          <div className="bg-muted h-5 w-48 rounded" />
          <div className="bg-muted mt-2 h-4 w-full rounded" />
        </div>
      ))}
    </div>
  );
}
```

Use mutations with optimistic updates:

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@gmacko/ui/button";
import { Input } from "@gmacko/ui/input";
import { useTRPC } from "~/trpc/react";

export function CreateForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const create = useMutation(
    trpc.yourFeature.create.mutationOptions({
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.yourFeature.list.queryKey(),
        });
      },
    }),
  );

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      create.mutate({ title: formData.get("title") as string });
      e.currentTarget.reset();
    }}>
      <Input name="title" placeholder="Title" required />
      <Button type="submit" disabled={create.isPending}>
        {create.isPending ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
```

### Phase 5: Mobile UI (→ frontend-development)

Build the same feature for Expo with NativeWind. The API layer is shared — only the UI changes.

```typescript
// apps/expo/src/app/your-feature/index.tsx
import { View, Text, FlatList } from "react-native";
import { api } from "~/utils/api";
import { CreateForm } from "./_components/create-form";

export default function YourFeatureScreen() {
  const { data: items, isLoading, refetch } = api.yourFeature.list.useQuery();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-muted-foreground">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-4">
      <Text className="text-2xl font-bold mb-6 text-foreground">Your Feature</Text>
      <CreateForm />
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <View className="p-4 bg-card rounded-lg mb-2 border border-border">
            <Text className="text-foreground">{item.title}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isLoading}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}
```

### Phase 6: Observability

Add analytics and error tracking to every feature:

```typescript
// In your mutation's onSuccess:
import { trackEvent } from "@gmacko/analytics/web";

onSuccess: (data) => {
  trackEvent("your_feature_created", {
    id: data.id,
    title: data.title,
  });
},
```

### Phase 7: Testing (→ testing)

Write tests at every level against the spec's acceptance criteria:

| Test Type | Location | What to Test |
|-----------|----------|--------------|
| **Unit** | `packages/validators/src/__tests__/` | Schema validation, edge cases |
| **Integration** | `packages/api/src/router/__tests__/` | tRPC procedures with real DB |
| **E2E** | `apps/nextjs/e2e/` | Full user flows in Playwright |

```bash
pnpm test              # Unit + integration tests
pnpm e2e               # Playwright E2E tests
pnpm typecheck         # Type safety across all packages
pnpm lint              # Lint check
```

### Phase 8: Compliance (→ saas-compliance)

For features that handle user data or sensitive operations:

- Add audit logging for mutations
- Verify RBAC (owner-only, admin-only) is enforced
- Check data retention/deletion compliance

## Feature Development Checklist

Before marking a feature as complete, verify all of these:

### Spec & Requirements
- [ ] Clear specification with acceptance criteria exists
- [ ] All edge cases identified and handled
- [ ] Permissions model defined and enforced

### Data & API
- [ ] Database schema uses shared builder pattern (`pgTable`)
- [ ] Validators in `@gmacko/validators` (shared between web/mobile)
- [ ] tRPC router with proper auth (public/protected/admin)
- [ ] Input validation on all mutations

### Web UI
- [ ] Server-side prefetching with `prefetch()` + `<HydrateClient>`
- [ ] Suspense boundaries with skeleton fallbacks
- [ ] Optimistic updates for mutations
- [ ] Empty states and error states
- [ ] Works in light and dark mode
- [ ] Responsive on mobile viewports

### Mobile UI
- [ ] Same feature available in Expo app (unless web-only)
- [ ] FlatList with performance optimizations
- [ ] Pull-to-refresh where appropriate
- [ ] NativeWind classes use semantic tokens (text-foreground, bg-card, etc.)

### Observability
- [ ] PostHog events tracked for key actions
- [ ] Sentry breadcrumbs on mutations
- [ ] Error boundaries around async components

### Testing
- [ ] Unit tests for validators and business logic
- [ ] Integration tests for tRPC procedures
- [ ] E2E tests for critical user flows
- [ ] All acceptance criteria have corresponding tests

### Quality
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm e2e` passes (if E2E tests exist)

## Integration Patterns

### If feature is optional (integration)

1. Add flag to `packages/config/src/integrations.ts`:

```typescript
export const integrations = {
  // ... existing
  yourFeature: false,
} as const;
```

2. Check flag before initializing:

```typescript
import { integrations } from "@gmacko/config";

if (integrations.yourFeature) {
  // Initialize feature
}
```

3. Add env vars to `.env.example` if needed

### If feature needs external service

1. Create wrapper package in `packages/your-service/`
2. Follow existing packages for pattern (analytics, monitoring, etc.)
3. Export unified interface that handles disabled state
