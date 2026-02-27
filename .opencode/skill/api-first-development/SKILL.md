---
name: api-first-development
description: Build APIs first, then implement web and mobile UIs with full platform parity
---

# API-First Development Skill

Build every feature API-first: schema → validation → tRPC router → web UI → mobile UI. This ensures type safety flows from the database to every client and guarantees feature parity across platforms unless explicitly specified otherwise.

## Workflow

1. **Gather requirements** — clarify the spec before writing code (see `spec-driven-development` skill)
2. **Schema** — define the data model in Drizzle
3. **Validators** — create shared Zod schemas in `@gmacko/validators` or co-locate in `@gmacko/db`
4. **Router** — implement tRPC procedures (queries, mutations)
5. **Web UI** — Next.js page with prefetching and shadcn/ui
6. **Mobile UI** — Expo screen with the same tRPC hooks
7. **Observability** — wire Sentry and PostHog at every layer
8. **Tests** — unit → integration → E2E (see `testing` skill)

## Checklist

- [ ] Shared Zod input/output schemas defined
- [ ] tRPC router created and added to `root.ts`
- [ ] Web page/component built with prefetching
- [ ] Mobile screen built with same tRPC queries
- [ ] Sentry breadcrumbs added for key mutations
- [ ] PostHog events tracked for key user actions
- [ ] Loading / error / empty states handled on both platforms
- [ ] Unit tests for router procedures
- [ ] Type-check passes (`pnpm typecheck`)

## Step 1: Shared Validators

Always define input and output schemas in a shared location so web and mobile reuse them:

```typescript
// packages/validators/src/feature-name.ts
import { z } from "zod/v4";

export const CreateFeatureSchema = z.object({
  title: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

export const UpdateFeatureSchema = CreateFeatureSchema.partial();

export const FeatureFilterSchema = z.object({
  status: z.enum(["active", "archived"]).optional(),
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type CreateFeatureInput = z.infer<typeof CreateFeatureSchema>;
export type FeatureFilter = z.infer<typeof FeatureFilterSchema>;
```

## Step 2: tRPC Router (API First)

Build the complete API before touching any UI:

```typescript
// packages/api/src/router/feature.ts
import type { TRPCRouterRecord } from "@trpc/server";

import { desc, eq } from "@gmacko/db";
import { feature } from "@gmacko/db/schema";
import {
  CreateFeatureSchema,
  FeatureFilterSchema,
  UpdateFeatureSchema,
} from "@gmacko/validators/feature-name";

import { protectedProcedure, publicProcedure } from "../trpc";

export const featureRouter = {
  list: publicProcedure
    .input(FeatureFilterSchema)
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(feature)
        .limit(input.limit)
        .orderBy(desc(feature.createdAt));
    }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [item] = await ctx.db
        .select()
        .from(feature)
        .where(eq(feature.id, input.id))
        .limit(1);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  create: protectedProcedure
    .input(CreateFeatureSchema)
    .mutation(async ({ ctx, input }) => {
      const [created] = await ctx.db
        .insert(feature)
        .values({ ...input, userId: ctx.session.user.id })
        .returning();
      return created;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid() }).merge(UpdateFeatureSchema))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(feature)
        .set(data)
        .where(eq(feature.id, id))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND" });
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(feature).where(eq(feature.id, input.id));
    }),
} satisfies TRPCRouterRecord;
```

## Step 3: Web Page with Prefetching

Use server-side prefetching for instant page loads:

```typescript
// apps/nextjs/src/app/features/page.tsx
import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { FeatureList, FeatureListSkeleton } from "./_components/feature-list";

export default function FeaturesPage() {
  // Prefetch on the server — data is ready before React hydrates
  prefetch(trpc.feature.list.queryOptions({ limit: 20 }));

  return (
    <HydrateClient>
      <main className="container mx-auto max-w-4xl py-8">
        <h1 className="mb-6 text-3xl font-bold">Features</h1>
        <Suspense fallback={<FeatureListSkeleton />}>
          <FeatureList />
        </Suspense>
      </main>
    </HydrateClient>
  );
}
```

### Client Component with Optimistic Updates

```typescript
// apps/nextjs/src/app/features/_components/feature-list.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

export function FeatureList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: features } = useQuery(
    trpc.feature.list.queryOptions({ limit: 20 }),
  );

  const deleteMutation = useMutation(
    trpc.feature.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.feature.list.queryKey(),
        });
      },
    }),
  );

  // ... render
}
```

### Prefetching on Navigation (Link Hover)

```typescript
import Link from "next/link";

import { trpc } from "~/trpc/server";

// Prefetch detail data on link render (server component)
export async function FeatureCard({ id, title }: { id: string; title: string }) {
  // This prefetches the detail query so it's cached when the user navigates
  prefetch(trpc.feature.byId.queryOptions({ id }));

  return (
    <Link href={`/features/${id}`} className="block rounded-lg border p-4 hover:shadow-md">
      <h3 className="font-semibold">{title}</h3>
    </Link>
  );
}
```

## Step 4: Mobile Screen (Feature Parity)

Mirror the web implementation using the same tRPC hooks:

```typescript
// apps/expo/src/app/features/index.tsx
import { View, Text, FlatList, ActivityIndicator, Pressable } from "react-native";
import { Link } from "expo-router";

import { api } from "~/utils/api";

export default function FeaturesScreen() {
  const { data, isLoading, isError, refetch } = api.feature.list.useQuery({
    limit: 20,
  });

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-destructive mb-4 text-center">
          Failed to load features
        </Text>
        <Pressable onPress={() => refetch()} className="rounded-md bg-primary px-4 py-2">
          <Text className="text-primary-foreground font-medium">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={data}
      contentContainerClassName="p-4 gap-2"
      renderItem={({ item }) => (
        <Link href={`/features/${item.id}`} asChild>
          <Pressable className="rounded-lg border border-border bg-card p-4">
            <Text className="text-foreground font-semibold">{item.title}</Text>
          </Pressable>
        </Link>
      )}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View className="items-center p-8">
          <Text className="text-muted-foreground">No features yet</Text>
        </View>
      }
    />
  );
}
```

## Step 5: Observability Integration

### Sentry — Error Tracking at Every Layer

```typescript
// In tRPC middleware (already wired in trpc.ts, add custom breadcrumbs)
import { captureException } from "@gmacko/monitoring/web";

// In mutations — add breadcrumbs for important operations
create: protectedProcedure
  .input(CreateFeatureSchema)
  .mutation(async ({ ctx, input }) => {
    try {
      const [created] = await ctx.db.insert(feature).values({...}).returning();
      return created;
    } catch (error) {
      captureException(error);
      throw error;
    }
  }),
```

### PostHog — Track User Behavior

```typescript
// In web UI components
import { useTrackEvent } from "@gmacko/analytics/web/hooks";

function FeatureCreateForm() {
  const trackEvent = useTrackEvent();

  const handleCreate = async (data: CreateFeatureInput) => {
    await createMutation.mutateAsync(data);
    trackEvent("feature_created", { priority: data.priority });
  };
}
```

## Platform Parity Checklist

When building any feature, ensure parity unless explicitly scoped to one platform:

| Aspect | Web (Next.js) | Mobile (Expo) |
|--------|---------------|---------------|
| Data fetching | `useQuery` / `prefetch` | `useQuery` |
| Mutations | `useMutation` + invalidate | `useMutation` + invalidate |
| Loading state | Skeleton / Suspense | ActivityIndicator |
| Error state | Alert component | Text + Retry button |
| Empty state | Centered message | `ListEmptyComponent` |
| Navigation | `<Link>` from next/link | `<Link>` from expo-router |
| Forms | shadcn/ui Input + Button | NativeWind TextInput + Pressable |
| Theme | CSS variables (light/dark) | NativeWind dark: variant |
| Analytics | `useTrackEvent` | same PostHog SDK |
| Auth guard | `redirect("/")` in server component | Expo Router redirect |

## Anti-Patterns to Avoid

- **Never build UI before the API is tested** — the router should work in isolation
- **Never skip shared validators** — duplicating Zod schemas across apps leads to drift
- **Never skip prefetching** — always use `prefetch()` in Next.js server components
- **Never build for one platform only** — unless the requirement explicitly says so
- **Never hardcode strings** — use the `@gmacko/i18n` package if i18n is enabled
