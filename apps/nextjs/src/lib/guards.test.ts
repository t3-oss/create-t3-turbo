import { describe, expect, it, vi } from "vitest";

/**
 * Unit tests for auth guard functions.
 *
 * These tests mock the auth module and next/navigation to verify
 * guard behavior without a running server. This pattern demonstrates
 * how to test Server Component utilities that depend on external services.
 */

// Mock next/navigation
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

// Mock auth
vi.mock("~/auth/server", () => ({
  getSession: vi.fn(),
}));

// Import after mocks are set up
const { getSession } = await import("~/auth/server");
const { redirect } = await import("next/navigation");

// Dynamic import guards after mocks
const { requireAuth, requireAdmin } = await import("./guards");

describe("requireAuth", () => {
  it("returns the session when user is authenticated", async () => {
    const mockSession = { user: { id: "1", name: "Test", email: "test@example.com" } };
    vi.mocked(getSession).mockResolvedValueOnce(mockSession as never);

    const session = await requireAuth();
    expect(session).toEqual(mockSession);
  });

  it("redirects to / when user is not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null as never);

    await expect(requireAuth()).rejects.toThrow("REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("redirects to custom URL when specified", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null as never);

    await expect(requireAuth("/sign-in")).rejects.toThrow("REDIRECT:/sign-in");
    expect(redirect).toHaveBeenCalledWith("/sign-in");
  });
});

describe("requireAdmin", () => {
  it("returns the session when user is admin", async () => {
    const mockSession = {
      user: { id: "1", name: "Admin", email: "admin@example.com", role: "admin" },
    };
    vi.mocked(getSession).mockResolvedValueOnce(mockSession as never);

    const session = await requireAdmin();
    expect(session).toEqual(mockSession);
  });

  it("redirects when user is not authenticated", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null as never);

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("redirects when user is not admin", async () => {
    const mockSession = {
      user: { id: "1", name: "User", email: "user@example.com", role: "user" },
    };
    vi.mocked(getSession).mockResolvedValueOnce(mockSession as never);

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/");
    expect(redirect).toHaveBeenCalledWith("/");
  });
});
