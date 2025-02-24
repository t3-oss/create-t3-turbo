import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { Post } from "@acme/db";

import { makeTestCaller, makeTestCallerWithSession } from "../tests/testCaller";

let caller: ReturnType<typeof makeTestCaller>;
let callerWithSession: ReturnType<typeof makeTestCallerWithSession>;

describe("post router", () => {
  beforeEach(() => {
    caller = makeTestCaller();
    callerWithSession = makeTestCallerWithSession();
  });

  afterEach(async () => {
    await Post.deleteMany();
  });

  test("all returns all posts", async () => {
    await Post.create({
      title: "Test Post",
      content: "Test Content",
    });

    const posts = await caller.post.all();
    expect(posts).toEqual([
      {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: expect.any(String),
        title: "Test Post",
        content: "Test Content",
      },
    ]);
  });

  test("byId returns post by id", async () => {
    const post = await Post.create({
      title: "Test Post",
      content: "Test Content",
    });

    const result = await caller.post.byId({ id: post._id.toString() });
    expect(result).toEqual({
      id: post._id.toString(),
      title: "Test Post",
      content: "Test Content",
    });
  });

  test("create creates a new post", async () => {
    await callerWithSession.post.create({
      title: "Test Post",
      content: "Test Content",
    });

    const posts = await Post.find();
    expect(posts.length).toBe(1);
    expect(posts[0]).toMatchObject({
      title: "Test Post",
      content: "Test Content",
    });
    expect(posts[0]?._id).toBeDefined();
    expect(posts[0]?.createdAt).toBeDefined();
    expect(posts[0]?.updatedAt).toBeDefined();
    expect(posts[0]?.__v).toBeDefined();
  });

  test("delete deletes a post", async () => {
    const post = await Post.create({
      title: "Test Post",
      content: "Test Content",
    });

    await callerWithSession.post.delete(post._id.toString());

    const posts = await Post.find();
    expect(posts.length).toBe(0);
  });
});
