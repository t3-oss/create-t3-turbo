/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@acme/db/client";
import { Post } from "@acme/db/schema";

import { makeTestCaller } from "../test-helpers";

// Mock database client before any imports that might use it
vi.mock("@acme/db/client", async () => {
  const { createMockDb } = await import("@acme/db/mocks");
  return { db: await createMockDb() };
});

describe("createPost", () => {
  beforeEach(async () => {
    await db.delete(Post);
  });

  it("Should create a post", async () => {
    const title = "Test";
    const content = "This is a test post";

    await db.insert(Post).values({ title, content });

    const posts = await db.select().from(Post);
    expect(posts).toHaveLength(1);

    expect(posts[0]?.title).toBe(title);
    expect(posts[0]?.content).toBe(content);
  });

  it("Should fetch all posts using makeTestCaller", async () => {
    // Setup: Insert test posts
    const testPosts = [
      {
        title: "Post 1",
        content: "Content 1",
        id: "a4a67229-1678-4a9c-845b-28a59224b448",
      },
      {
        title: "Post 2",
        content: "Content 2",
        id: "fae4cb3f-6059-48d2-a82a-2ca5d8bff937",
      },
    ];

    for (const post of testPosts) {
      await db.insert(Post).values(post);
    }

    const caller = makeTestCaller();

    // Test: Call the post.all query
    const posts = await caller.post.all();

    // Verify
    expect(posts).toHaveLength(2);
    expect(posts[0]?.title).toBe("Post 2");
    expect(posts[1]?.title).toBe("Post 1");
  });

  it("Should fetch a post by id using makeTestCaller", async () => {
    const testPost = {
      id: "fae4cb3f-6059-48d2-a82a-2ca5d8bff937",
      title: "Test Post",
      content: "Test Content",
    };

    await db.insert(Post).values(testPost);

    const caller = makeTestCaller();
    const post = await caller.post.byId({ id: testPost.id });

    expect(post?.id).toBe(testPost.id);
    expect(post?.title).toBe(testPost.title);
  });

  it("Should create a post using makeTestCaller", async () => {
    const caller = makeTestCaller({
      session: {
        user: { id: "user-123" },
      } as any,
    });

    await caller.post.create({ title: "New Post", content: "New Content" });

    const posts = await db.select().from(Post);
    expect(posts).toHaveLength(1);
    expect(posts[0]?.title).toBe("New Post");
  });

  it("Should delete a post using makeTestCaller", async () => {
    const testPost = {
      id: "b8c9d0e1-2f3a-4b5c-6d7e-8f9a0b1c2d3e",
      title: "Test",
      content: "Test",
    };
    await db.insert(Post).values(testPost);

    const caller = makeTestCaller({
      session: {
        user: { id: "user-123" },
      } as any,
    });

    await caller.post.delete(testPost.id);

    const posts = await db.select().from(Post);
    expect(posts).toHaveLength(0);
  });
});
