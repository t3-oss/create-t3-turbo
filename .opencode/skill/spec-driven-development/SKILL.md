---
name: spec-driven-development
description: Gather requirements, write specs, and develop features against clear acceptance criteria
---

# Spec-Driven Development Skill

Never start coding without a clear specification. This skill guides you through gathering requirements, writing a spec, and developing features against explicit acceptance criteria.

## Workflow

1. **Understand** — read the user's request carefully
2. **Question** — ask clarifying questions to fill gaps
3. **Specify** — write a structured specification document
4. **Approve** — get user sign-off on the spec
5. **Implement** — build against the spec (API-first)
6. **Verify** — test against every acceptance criterion

## Step 1: Initial Assessment

When a user describes a feature, immediately check for these gaps:

### Required Information

| Category | Questions to Ask |
|----------|-----------------|
| **Users** | Who uses this? (anonymous, authenticated, admin, API consumer) |
| **Data** | What data does this feature create/read/update/delete? |
| **Behavior** | What happens when the user performs the action? |
| **Validation** | What are the constraints? (min/max lengths, required fields, formats) |
| **Permissions** | Who can do what? (owner only, any authenticated user, admin) |
| **Platforms** | Web only, mobile only, or both? (default: both) |
| **Error handling** | What happens when things go wrong? (not found, unauthorized, invalid) |
| **Edge cases** | Empty states, pagination, concurrent access? |

### Optional Information

| Category | Questions to Ask |
|----------|-----------------|
| **Performance** | Expected data volume? Need pagination or infinite scroll? |
| **Realtime** | Should changes appear in real-time for other users? |
| **Notifications** | Should users be notified? (email, push, in-app) |
| **Analytics** | What events should we track? |
| **i18n** | Any strings that need translation? |

## Step 2: Write the Specification

Create a spec document with this structure:

```markdown
# Feature: [Name]

## Overview
[One paragraph describing the feature and its purpose]

## User Stories
- As a [role], I want to [action] so that [benefit]
- As a [role], I want to [action] so that [benefit]

## Data Model

### New Tables
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default random | |
| userId | text | FK → user.id, cascade | Owner |
| title | varchar(256) | NOT NULL | |
| status | varchar(20) | NOT NULL, default 'active' | active, archived |
| createdAt | timestamp | NOT NULL, default now() | |

### Modified Tables
- None

## API Endpoints

### `feature.list`
- **Auth:** Public
- **Input:** `{ status?: "active" | "archived", limit?: number, cursor?: string }`
- **Output:** `Feature[]`
- **Behavior:** Returns features ordered by createdAt desc, paginated

### `feature.create`
- **Auth:** Protected (authenticated users)
- **Input:** `{ title: string, description?: string }`
- **Output:** `Feature`
- **Validation:** title required, min 1, max 256
- **Side effects:** PostHog event `feature_created`

### `feature.delete`
- **Auth:** Protected (owner or admin)
- **Input:** `{ id: string }`
- **Behavior:** Soft delete (set status to 'archived') or hard delete?

## UI Specifications

### Web (Next.js)
- **Route:** `/features`
- **Components:**
  - Feature list with cards
  - Create form (title, description)
  - Empty state when no features
  - Pagination or infinite scroll
- **Prefetching:** Prefetch `feature.list` on server

### Mobile (Expo)
- **Route:** `/features`
- **Components:** Same as web, adapted to FlatList
- **Pull to refresh:** Yes

## Acceptance Criteria
- [ ] Authenticated user can create a feature with title and optional description
- [ ] Feature appears in the list immediately after creation
- [ ] Empty state shown when no features exist
- [ ] Title validation: min 1 char, max 256 chars, error shown for violations
- [ ] Only owner or admin can delete a feature
- [ ] Deleted features no longer appear in the list
- [ ] PostHog event tracked on create
- [ ] Sentry breadcrumb added for mutations
- [ ] Works on both web and mobile

## Out of Scope
- [List things explicitly NOT included in this feature]

## Open Questions
- [Any unresolved decisions]
```

## Step 3: Questions Template

When you need to gather more information, use this structured format:

```
I need a few more details before I can build this:

**Data:**
1. What fields does [entity] need? (I'm assuming: title, description, status — anything else?)
2. Should [entity] belong to a user, or is it global?

**Behavior:**
3. When a user [action], should [consequence]?
4. Should this support pagination? What's the expected volume?

**Permissions:**
5. Can any authenticated user [action], or only the owner?
6. Should admins be able to [action] on behalf of users?

**Platforms:**
7. Should this work on both web and mobile, or web only?

**Edge cases:**
8. What should happen when [edge case]?
```

## Step 4: Spec → Implementation Mapping

Once the spec is approved, map it directly to implementation tasks:

```
Spec Section              → Implementation
─────────────────────────────────────────────────
Data Model                → packages/db/src/schema.ts
  + Zod schemas           → packages/validators/src/feature.ts
API Endpoints             → packages/api/src/router/feature.ts
  + Add to root           → packages/api/src/root.ts
Web UI                    → apps/nextjs/src/app/features/
  + Page                  → page.tsx (with prefetch)
  + Components            → _components/*.tsx
Mobile UI                 → apps/expo/src/app/features/
  + Screen                → index.tsx
  + Components            → _components/*.tsx
Acceptance Criteria       → apps/nextjs/e2e/features.spec.ts
  + Unit tests            → packages/api/src/router/__tests__/feature.test.ts
  + Integration tests     → packages/api/src/router/__tests__/feature.integration.test.ts
```

## Step 5: Verification Checklist

Before marking a feature as complete, verify against the spec:

```
□ Every acceptance criterion has a passing test
□ Every API endpoint works as specified
□ Every validation rule is enforced
□ Every error case is handled
□ Web UI matches the spec
□ Mobile UI matches the spec (unless web-only)
□ Analytics events are firing
□ Error tracking is wired
□ Types pass (pnpm typecheck)
□ Lint passes (pnpm lint)
□ All tests pass (pnpm test && pnpm e2e)
```

## Example: Turning a Vague Request into a Spec

**User says:** "Add a comments feature"

**You respond:**

> I'd love to build a comments feature. Let me ask a few questions so I can spec this out:
>
> 1. **What can be commented on?** Posts only, or other entities too?
> 2. **Nesting?** Flat comments, or threaded/nested replies?
> 3. **Who can comment?** Authenticated users only?
> 4. **Editing/deletion?** Can users edit their own comments? Can admins delete any?
> 5. **Notifications?** Should the post author be notified of new comments?
> 6. **Moderation?** Any need for flagging/reporting?
> 7. **Platforms?** Both web and mobile?
>
> Once I have these answers, I'll write up a full spec for your approval before I start coding.
