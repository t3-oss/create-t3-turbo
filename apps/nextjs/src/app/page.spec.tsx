import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HomePage from "./page";

const { prefetchSpy, mockQueryOptionsResult, queryOptionsSpy } = vi.hoisted(
  () => {
    const mockQueryOptionsResult = { queryKey: ["posts"], queryFn: vi.fn() };
    const queryOptionsSpy = vi.fn(() => mockQueryOptionsResult);

    return {
      prefetchSpy: vi.fn(),
      mockQueryOptionsResult,
      queryOptionsSpy,
    };
  },
);

vi.mock("~/trpc/server", () => ({
  HydrateClient: ({ children }: { children: ReactNode }) => (
    <div data-testid="hydrate-client">{children}</div>
  ),
  prefetch: prefetchSpy,
  trpc: {
    post: {
      all: {
        queryOptions: queryOptionsSpy,
      },
    },
  },
}));

vi.mock("./_components/auth-showcase", () => ({
  AuthShowcase: () => <div data-testid="auth-showcase">Auth Showcase</div>,
}));

vi.mock("./_components/posts", () => ({
  CreatePostForm: () => (
    <button data-testid="create-post-form">Create Post</button>
  ),
  PostCardSkeleton: () => <div data-testid="post-card-skeleton">Skeleton</div>,
  PostList: () => <div data-testid="post-list">Post List</div>,
}));

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prefetches the posts query before rendering", () => {
    render(<HomePage />);

    expect(queryOptionsSpy).toHaveBeenCalledTimes(1);
    expect(prefetchSpy).toHaveBeenCalledWith(mockQueryOptionsResult);
  });

  it("renders the hero heading and key child components", () => {
    render(<HomePage />);

    const heroHeadings = screen.getAllByRole("heading", {
      name: /create\s+t3\s+turbo/i,
    });
    expect(heroHeadings).toHaveLength(1);
    expect(screen.getByTestId("hydrate-client")).toBeInTheDocument();
    expect(screen.getByTestId("auth-showcase")).toBeInTheDocument();
    expect(screen.getByTestId("create-post-form")).toBeInTheDocument();
    expect(screen.getByTestId("post-list")).toBeInTheDocument();
  });
});
