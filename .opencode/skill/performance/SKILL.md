---
name: performance
description: Preloading, prefetching, caching, and polish patterns for a production-quality app
---

# Performance & Polish Skill

Build polished, production-quality features with proper preloading, caching, optimistic updates, and responsive design. Every page should feel instant.

## Core Principles

1. **Prefetch everything** — data should be ready before the user needs it
2. **Show something immediately** — use skeletons and Suspense boundaries
3. **Optimistic updates** — update the UI before the server confirms
4. **Cache aggressively** — minimize redundant network requests
5. **Measure, don't guess** — use PostHog and Web Vitals to verify

## Server-Side Prefetching (Next.js)

### Page-Level Prefetch

Every page that displays tRPC data MUST prefetch on the server:

```typescript
// apps/nextjs/src/app/features/page.tsx
import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { FeatureList, FeatureListSkeleton } from "./_components/feature-list";

export default function FeaturesPage() {
  // ✅ Prefetch on the server — zero client-side loading
  prefetch(trpc.feature.list.queryOptions({ limit: 20 }));

  return (
    <HydrateClient>
      <Suspense fallback={<FeatureListSkeleton />}>
        <FeatureList />
      </Suspense>
    </HydrateClient>
  );
}
```

### Detail Page Prefetch

```typescript
// apps/nextjs/src/app/features/[id]/page.tsx
import { notFound } from "next/navigation";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";

export default async function FeatureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Prefetch the specific resource
  prefetch(trpc.feature.byId.queryOptions({ id }));

  return (
    <HydrateClient>
      <FeatureDetail id={id} />
    </HydrateClient>
  );
}
```

### Prefetching Related Data

When you know the user will navigate to a detail page, prefetch in the list:

```typescript
// Server component that renders a list of links
export default function FeaturesPage() {
  // Prefetch list AND the first few detail pages
  prefetch(trpc.feature.list.queryOptions({ limit: 20 }));

  return (
    <HydrateClient>
      <Suspense fallback={<FeatureListSkeleton />}>
        <FeatureList />
      </Suspense>
    </HydrateClient>
  );
}
```

## Suspense Boundaries & Skeletons

### Page-Level Suspense

Wrap every async data component in a Suspense boundary with a skeleton:

```typescript
<Suspense fallback={<FeatureListSkeleton />}>
  <FeatureList />
</Suspense>
```

### Skeleton Components

Create meaningful skeletons that match the layout of loaded content:

```typescript
export function FeatureListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-lg border p-4">
          <div className="bg-muted h-5 w-48 rounded" />
          <div className="bg-muted mt-2 h-4 w-full rounded" />
          <div className="bg-muted mt-1 h-4 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function FeatureDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-8 w-64 rounded" />
      <div className="bg-muted h-4 w-full rounded" />
      <div className="bg-muted h-4 w-full rounded" />
      <div className="bg-muted h-4 w-3/4 rounded" />
    </div>
  );
}
```

### Independent Suspense Zones

Split pages into independent loading zones so fast queries don't wait for slow ones:

```typescript
export default function DashboardPage() {
  prefetch(trpc.admin.stats.queryOptions());
  prefetch(trpc.post.all.queryOptions());
  prefetch(trpc.admin.listUsers.queryOptions());

  return (
    <HydrateClient>
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stats load independently of user list */}
        <Suspense fallback={<StatsSkeleton />}>
          <StatsCards />
        </Suspense>
        <Suspense fallback={<RecentUsersSkeleton />}>
          <RecentUsers />
        </Suspense>
      </div>
      <Suspense fallback={<PostListSkeleton />}>
        <RecentPosts />
      </Suspense>
    </HydrateClient>
  );
}
```

## Optimistic Updates

Update the UI immediately before the server responds:

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "~/trpc/react";

export function CreateFeatureForm() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createMutation = useMutation(
    trpc.feature.create.mutationOptions({
      // Optimistic update: add to list immediately
      onMutate: async (newFeature) => {
        await queryClient.cancelQueries({
          queryKey: trpc.feature.list.queryKey(),
        });

        const previous = queryClient.getQueryData(
          trpc.feature.list.queryKey(),
        );

        queryClient.setQueryData(
          trpc.feature.list.queryKey(),
          (old: any) => [
            { id: "temp-" + Date.now(), ...newFeature, createdAt: new Date() },
            ...(old ?? []),
          ],
        );

        return { previous };
      },

      // Rollback on error
      onError: (_err, _vars, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            trpc.feature.list.queryKey(),
            context.previous,
          );
        }
      },

      // Refetch after settle
      onSettled: () => {
        void queryClient.invalidateQueries({
          queryKey: trpc.feature.list.queryKey(),
        });
      },
    }),
  );

  // ...
}
```

## Image & Asset Optimization

### Next.js Images

Always use `next/image` for optimized loading:

```typescript
import Image from "next/image";

// ✅ Optimized with lazy loading, responsive sizing, and modern formats
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
/>

// ✅ For hero images, use priority to preload
<Image src="/hero.png" alt="Hero" width={1200} height={600} priority />
```

### Font Loading

Fonts are loaded via `next/font` with swap display:

```typescript
// Already configured in layout.tsx
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
```

## Caching Strategy

### tRPC Query Stale Times

Configure appropriate stale times for different data types:

```typescript
// Static data (plans, config) — cache for 5 minutes
const { data: plans } = useQuery(
  trpc.subscription.plans.queryOptions(undefined, {
    staleTime: 5 * 60 * 1000,
  }),
);

// User-specific data — cache for 1 minute
const { data: prefs } = useQuery(
  trpc.settings.getPreferences.queryOptions(undefined, {
    staleTime: 60 * 1000,
  }),
);

// Frequently changing data — no stale time (always refetch)
const { data: posts } = useQuery(trpc.post.all.queryOptions());
```

### Revalidation Patterns

```typescript
// Invalidate specific queries after mutations
onSuccess: () => {
  void queryClient.invalidateQueries({
    queryKey: trpc.feature.list.queryKey(),
  });
},

// Invalidate all queries for a router
onSuccess: () => {
  void queryClient.invalidateQueries({
    queryKey: [["feature"]],  // All feature.* queries
  });
},
```

## Web Vitals Monitoring

Track Core Web Vitals with PostHog:

```typescript
// apps/nextjs/src/app/layout.tsx or providers.tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";

import { trackEvent } from "@gmacko/analytics/web";

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    trackEvent("web_vitals", {
      name: metric.name,     // CLS, FID, FCP, LCP, TTFB
      value: metric.value,
      rating: metric.rating, // good, needs-improvement, poor
      delta: metric.delta,
    });
  });

  return null;
}
```

## Mobile Performance (Expo)

### FlatList Optimization

```typescript
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={5}
  initialNumToRender={10}
  getItemLayout={(_, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### Avoid Re-renders

```typescript
import { memo, useCallback } from "react";

// Memoize list items
const FeatureItem = memo(function FeatureItem({ item }: { item: Feature }) {
  return (
    <View className="rounded-lg border border-border bg-card p-4">
      <Text className="text-foreground font-semibold">{item.title}</Text>
    </View>
  );
});

// Memoize renderItem callback
const renderItem = useCallback(
  ({ item }: { item: Feature }) => <FeatureItem item={item} />,
  [],
);
```

## Polish Checklist

Before shipping any feature:

### Visual
- [ ] Loading skeletons match final layout
- [ ] Empty states have helpful messaging
- [ ] Error states offer retry actions
- [ ] Transitions are smooth (no layout shift)
- [ ] Works in both light and dark mode
- [ ] Responsive on mobile viewport sizes

### Performance
- [ ] Server-side prefetching for all page data
- [ ] Suspense boundaries around async components
- [ ] Images use `next/image` with appropriate sizing
- [ ] No unnecessary client-side data fetching
- [ ] Optimistic updates for mutations
- [ ] Appropriate stale times on queries

### Accessibility
- [ ] Keyboard navigation works
- [ ] Focus management on route changes
- [ ] ARIA labels on icon-only buttons
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader friendly

### SEO (public pages)
- [ ] Metadata exported from page
- [ ] Semantic heading hierarchy (h1 → h2 → h3)
- [ ] Open Graph tags for social sharing
