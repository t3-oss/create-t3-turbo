---
name: testing
description: Write and run unit tests, integration tests, and E2E Playwright tests against a spec
---

# Testing Skill

Comprehensive testing workflow: unit tests (Vitest), integration tests (Vitest + DB), and E2E functional tests (Playwright) written against a specification. If no spec exists, prompt the user to provide one before writing tests.

## Testing Pyramid

```
         /  E2E  \        ← Playwright: full user flows against the spec
        /  Integ  \       ← Vitest + real DB: router procedures end-to-end
       /   Unit    \      ← Vitest: pure logic, validators, utils
```

**Rule: every feature ships with tests at all three levels.**

## Prerequisite: Specification

Before writing any test, you MUST have a clear specification. If the user has not provided one:

1. **Ask** for the feature requirements (see `spec-driven-development` skill)
2. **Document** acceptance criteria as a checklist
3. **Map** each criterion to a test case
4. **Get approval** before writing test code

### Spec → Test Mapping Example

```
Spec: "Users can create posts with a title (required, max 256 chars) and content (required)"

Unit tests:
  ✓ CreatePostSchema rejects empty title
  ✓ CreatePostSchema rejects title > 256 chars
  ✓ CreatePostSchema rejects missing content
  ✓ CreatePostSchema accepts valid input

Integration tests:
  ✓ post.create inserts a row and returns the post
  ✓ post.create requires authentication
  ✓ post.all returns created posts

E2E tests:
  ✓ Authenticated user can create a post from the form
  ✓ Post appears in the list after creation
  ✓ Form shows validation error for empty title
```

## Unit Tests (Vitest)

### Where to Put Them

```
packages/
├── api/src/router/__tests__/post.test.ts
├── db/src/__tests__/schema.test.ts
├── validators/src/__tests__/feature-name.test.ts
├── settings/src/__tests__/schemas.test.ts
└── create-gmacko-app/src/__tests__/types.test.ts
```

### Running

```bash
pnpm test                          # All unit tests
pnpm -F @gmacko/api test          # API package only
pnpm -F @gmacko/api test:watch    # Watch mode
pnpm test:coverage                 # With coverage report
```

### Patterns

#### Testing Zod Schemas

```typescript
// packages/validators/src/__tests__/feature-name.test.ts
import { describe, expect, it } from "vitest";

import { CreateFeatureSchema } from "../feature-name";

describe("CreateFeatureSchema", () => {
  it("accepts valid input", () => {
    const result = CreateFeatureSchema.safeParse({
      title: "My Feature",
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = CreateFeatureSchema.safeParse({
      title: "",
      priority: "low",
    });
    expect(result.success).toBe(false);
  });

  it("rejects title exceeding max length", () => {
    const result = CreateFeatureSchema.safeParse({
      title: "a".repeat(257),
    });
    expect(result.success).toBe(false);
  });

  it("defaults priority to medium", () => {
    const result = CreateFeatureSchema.parse({
      title: "Test",
    });
    expect(result.priority).toBe("medium");
  });
});
```

#### Testing Utility Functions

```typescript
// packages/api/src/__tests__/utils.test.ts
import { describe, expect, it } from "vitest";

import { generateApiKey, hashApiKey } from "../utils";

describe("API Key Utils", () => {
  it("generates keys with gmk_ prefix", () => {
    const key = generateApiKey();
    expect(key).toMatch(/^gmk_/);
  });

  it("produces deterministic hashes", () => {
    const key = "gmk_test_key";
    expect(hashApiKey(key)).toBe(hashApiKey(key));
  });

  it("produces different hashes for different keys", () => {
    expect(hashApiKey("gmk_a")).not.toBe(hashApiKey("gmk_b"));
  });
});
```

## Integration Tests (Vitest + Database)

Integration tests exercise tRPC procedures against a real (or test) database.

### Setup

```typescript
// packages/api/src/__tests__/helpers/setup.ts
import { beforeAll, afterAll, afterEach } from "vitest";
import { sql } from "drizzle-orm";

import { db } from "@gmacko/db/client";

// Clean tables between tests
export async function cleanDatabase() {
  await db.execute(sql`TRUNCATE TABLE post, user_preferences, api_keys CASCADE`);
}

// Create a test user for authenticated procedures
export async function createTestUser() {
  const [user] = await db
    .insert(schema.user)
    .values({
      id: "test-user-id",
      name: "Test User",
      email: "integration@test.com",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();
  return user!;
}
```

### Testing Router Procedures

```typescript
// packages/api/src/router/__tests__/post.integration.test.ts
import { describe, expect, it, beforeEach } from "vitest";

import { db } from "@gmacko/db/client";
import { Post } from "@gmacko/db/schema";

import { cleanDatabase, createTestUser } from "../helpers/setup";

describe("post router (integration)", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("creates a post and returns it", async () => {
    const user = await createTestUser();

    // Call the procedure directly or through a test caller
    const [created] = await db
      .insert(Post)
      .values({ title: "Test Post", content: "Test content" })
      .returning();

    expect(created).toBeDefined();
    expect(created!.title).toBe("Test Post");
  });

  it("lists all posts", async () => {
    await db.insert(Post).values([
      { title: "Post 1", content: "Content 1" },
      { title: "Post 2", content: "Content 2" },
    ]);

    const posts = await db.select().from(Post);
    expect(posts).toHaveLength(2);
  });
});
```

### Testing with tRPC Test Caller

```typescript
// packages/api/src/__tests__/helpers/caller.ts
import { appRouter } from "../../root";
import { createTRPCContext } from "../../trpc";

export async function createAuthenticatedCaller(userId: string) {
  const ctx = await createTRPCContext({
    headers: new Headers(),
    auth: {} as any, // Mock auth for testing
  });

  // Override session for testing
  return appRouter.createCaller({
    ...ctx,
    session: {
      user: { id: userId, name: "Test", email: "test@test.com" },
      session: null,
    },
  });
}

export async function createPublicCaller() {
  const ctx = await createTRPCContext({
    headers: new Headers(),
    auth: {} as any,
  });
  return appRouter.createCaller(ctx);
}
```

## E2E Tests (Playwright)

E2E tests are written against the feature specification and test real user flows in the browser.

### Directory Structure

```
apps/nextjs/e2e/
├── auth.setup.ts          # Shared auth state setup
├── fixtures/
│   └── test-data.ts       # Shared test data
├── pages/
│   ├── home.spec.ts       # Landing page tests
│   ├── settings.spec.ts   # Settings tests
│   └── admin.spec.ts      # Admin tests
└── flows/
    ├── signup-to-post.spec.ts     # Full user journey
    └── subscription-upgrade.spec.ts
```

### Authentication Setup

```typescript
// apps/nextjs/e2e/auth.setup.ts
import { test as setup, expect } from "@playwright/test";

const ADMIN_FILE = "e2e/.auth/admin.json";
const USER_FILE = "e2e/.auth/user.json";

setup("authenticate as admin", async ({ page }) => {
  // Use the default seed accounts
  await page.goto("/api/auth/signin");
  await page.fill('[name="email"]', "admin@example.com");
  await page.fill('[name="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
  await page.context().storageState({ path: ADMIN_FILE });
});

setup("authenticate as test user", async ({ page }) => {
  await page.goto("/api/auth/signin");
  await page.fill('[name="email"]', "test@example.com");
  await page.fill('[name="password"]', "test123");
  await page.click('button[type="submit"]');
  await page.waitForURL("/");
  await page.context().storageState({ path: USER_FILE });
});
```

### Writing E2E Tests Against a Spec

```typescript
// apps/nextjs/e2e/pages/settings.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  // Use authenticated state
  test.use({ storageState: "e2e/.auth/user.json" });

  /**
   * SPEC: User can view and update their theme preference
   * Acceptance: Theme toggle changes persist after page reload
   */
  test("user can change theme preference", async ({ page }) => {
    await page.goto("/settings");

    // Verify settings page loads
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Click "Dark" theme button
    await page.getByRole("button", { name: "Dark" }).click();

    // Reload page and verify persistence
    await page.reload();
    const darkButton = page.getByRole("button", { name: "Dark" });
    await expect(darkButton).toHaveAttribute("data-state", "active");
  });

  /**
   * SPEC: User can create and revoke API keys
   * Acceptance:
   *   - Key is displayed once after creation
   *   - Key appears in the list
   *   - Revoked key disappears from list
   */
  test("user can create and revoke API keys", async ({ page }) => {
    await page.goto("/settings");

    // Create a new key
    await page.getByRole("button", { name: "Create New Key" }).click();
    await page.fill('[id="keyName"]', "E2E Test Key");
    await page.getByLabel("read").check();
    await page.getByRole("button", { name: "Create Key" }).click();

    // Verify key is shown
    await expect(page.getByText("API Key Created Successfully")).toBeVisible();
    const keyText = await page.locator("code").first().textContent();
    expect(keyText).toMatch(/^gmk_/);

    // Dismiss and verify key appears in list
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(page.getByText("E2E Test Key")).toBeVisible();

    // Revoke the key
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Revoke" }).click();

    // Verify key is gone
    await expect(page.getByText("E2E Test Key")).not.toBeVisible();
  });
});
```

### Testing Subscription Flows

```typescript
// apps/nextjs/e2e/flows/subscription-upgrade.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Subscription Management", () => {
  test.use({ storageState: "e2e/.auth/user.json" });

  /**
   * SPEC: User can view their current plan and available upgrades
   */
  test("displays current plan and upgrade options", async ({ page }) => {
    await page.goto("/settings/billing");

    // Verify current plan badge
    await expect(page.getByText("Current Plan")).toBeVisible();

    // Verify all plan tiers are shown
    await expect(page.getByText("Free")).toBeVisible();
    await expect(page.getByText("Starter")).toBeVisible();
    await expect(page.getByText("Pro")).toBeVisible();
    await expect(page.getByText("Enterprise")).toBeVisible();

    // Verify pricing
    await expect(page.getByText("$19")).toBeVisible();
    await expect(page.getByText("$49")).toBeVisible();
    await expect(page.getByText("Custom")).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
pnpm -F @gmacko/nextjs e2e

# Run specific test file
pnpm -F @gmacko/nextjs e2e -- settings.spec.ts

# Run with UI mode (interactive debugging)
pnpm -F @gmacko/nextjs exec playwright test --ui

# Run specific project (browser)
pnpm -F @gmacko/nextjs exec playwright test --project=chromium

# View test report
pnpm -F @gmacko/nextjs exec playwright show-report
```

## Test Writing Guidelines

### Naming Convention

```typescript
// Unit tests: describe what the unit does
describe("CreatePostSchema", () => {
  it("accepts valid input", ...);
  it("rejects empty title", ...);
});

// Integration tests: describe the behavior
describe("post.create", () => {
  it("inserts a row and returns the post", ...);
  it("requires authentication", ...);
});

// E2E tests: describe the user story with spec reference
test("user can create a post from the form", ...);
test("post appears in the list after creation", ...);
```

### Coverage Targets

| Layer | Target | Enforced |
|-------|--------|----------|
| Unit (validators, utils) | 90%+ | Yes |
| Integration (routers) | 80%+ | Yes |
| E2E (critical paths) | All acceptance criteria | Manual |

### What to Test at Each Level

| Level | Test | Don't Test |
|-------|------|------------|
| Unit | Schema validation, pure functions, transformations | Database queries, API calls, UI rendering |
| Integration | Router procedures, DB queries, auth middleware | Browser behavior, visual layout |
| E2E | User flows, page navigation, form submissions | Internal implementation, edge cases covered by unit tests |

## Prompting for Missing Specs

If a user asks you to test a feature but hasn't provided a spec, ask these questions:

1. **What is the feature?** (one sentence)
2. **Who uses it?** (anonymous, authenticated user, admin)
3. **What are the success criteria?** (list of behaviors)
4. **What are the error cases?** (invalid input, unauthorized, not found)
5. **Are there edge cases?** (empty lists, max lengths, concurrent access)

Then create a test plan document before writing any test code:

```markdown
## Test Plan: [Feature Name]

### Acceptance Criteria
- [ ] Criterion 1 → `unit: test_name` + `e2e: test_name`
- [ ] Criterion 2 → `integration: test_name`

### Error Cases
- [ ] Invalid input → `unit: schema_rejects_invalid`
- [ ] Unauthorized → `integration: requires_auth`

### Edge Cases
- [ ] Empty list → `e2e: shows_empty_state`
```
