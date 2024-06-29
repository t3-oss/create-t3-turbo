/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment */
import { cleanup, render, screen } from "@testing-library/react";
import superjson from "superjson";
import { beforeEach, describe, expect, test } from "vitest";

import {
  CreatePostForm,
  PostCard,
  PostCardSkeleton,
  PostList,
} from "~/app/_components/posts";
import Layout from "../layout";

beforeEach(cleanup);

describe("CreatePostForm", () => {
  test("renders", () => {
    render(
      <Layout>
        <CreatePostForm />
      </Layout>,
    );
    expect(screen.getByRole("button", { name: "Create" })).toBeDefined();
  });
});

describe("PostList", () => {
  test("renders posts", () => {
    render(
      <Layout>
        <PostList
          posts={superjson.stringify([
            {
              _id: 1,
              id: "1",
              title: "Test Post",
              content: "Test Content",
            },
          ])}
        />
      </Layout>,
    );
    expect(screen.getByText("Test Post")).toBeDefined();
    expect(screen.getByText("Test Content")).toBeDefined();
  });
});

describe("PostCard", () => {
  test("renders", () => {
    render(
      <Layout>
        <PostCard
          post={
            {
              _id: 1,
              id: "1",
              title: "Test Post",
              content: "Test Content",
            } as any
          }
        />
      </Layout>,
    );

    expect(screen.getByText("Test Post")).toBeDefined();
    expect(screen.getByText("Test Content")).toBeDefined();
  });
});

describe("PostCardSkeleton", () => {
  test("renders", () => {
    render(<PostCardSkeleton />);
    expect(screen.getByRole("heading", { level: 2 })).toBeDefined();
  });
});
