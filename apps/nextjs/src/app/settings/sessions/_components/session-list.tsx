"use client";

import { useState } from "react";

import { Badge } from "@gmacko/ui/badge";
import { Button } from "@gmacko/ui/button";

/**
 * Session list component.
 *
 * Better Auth provides session management via its API:
 *   - GET /api/auth/session — current session
 *   - GET /api/auth/list-sessions — all sessions for the user
 *   - POST /api/auth/revoke-session — revoke a specific session
 *   - POST /api/auth/revoke-other-sessions — revoke all except current
 *
 * Wire these up to your auth client for full functionality.
 */
export function SessionList() {
  const [revoking, setRevoking] = useState<string | null>(null);

  // This is a scaffold — replace with actual Better Auth API calls:
  // const sessions = await authClient.listSessions();
  const sessions = [
    {
      id: "current",
      isCurrent: true,
      userAgent: "Chrome on macOS",
      ipAddress: "127.0.0.1",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    },
  ];

  async function revokeSession(sessionId: string) {
    setRevoking(sessionId);
    try {
      // await authClient.revokeSession({ sessionId });
      // Refresh the session list after revocation
      console.log("Revoke session:", sessionId);
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllOtherSessions() {
    setRevoking("all");
    try {
      // await authClient.revokeOtherSessions();
      console.log("Revoke all other sessions");
    } finally {
      setRevoking(null);
    }
  }

  function parseUserAgent(ua: string): {
    browser: string;
    os: string;
  } {
    // Simplified UA parsing — replace with a proper library if needed
    if (ua.includes("Chrome")) return { browser: "Chrome", os: extractOs(ua) };
    if (ua.includes("Firefox"))
      return { browser: "Firefox", os: extractOs(ua) };
    if (ua.includes("Safari")) return { browser: "Safari", os: extractOs(ua) };
    if (ua.includes("Edge")) return { browser: "Edge", os: extractOs(ua) };
    return { browser: "Unknown", os: "Unknown" };
  }

  function extractOs(ua: string): string {
    if (ua.includes("Mac")) return "macOS";
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("iPhone") || ua.includes("iPad")) return "iOS";
    if (ua.includes("Android")) return "Android";
    return "Unknown";
  }

  return (
    <div className="space-y-4">
      {sessions.length > 1 && (
        <div className="flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={revokeAllOtherSessions}
            disabled={revoking === "all"}
          >
            {revoking === "all" ? "Revoking..." : "Revoke All Other Sessions"}
          </Button>
        </div>
      )}

      {sessions.map((session) => {
        const { browser, os } = parseUserAgent(session.userAgent);
        return (
          <div
            key={session.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-4">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground text-sm font-medium">
                    {browser} on {os}
                  </span>
                  {session.isCurrent && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </div>
                <div className="text-muted-foreground text-xs">
                  {session.ipAddress} &middot; Active since{" "}
                  {new Date(session.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {!session.isCurrent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => revokeSession(session.id)}
                disabled={revoking === session.id}
              >
                {revoking === session.id ? "Revoking..." : "Revoke"}
              </Button>
            )}
          </div>
        );
      })}

      {sessions.length === 0 && (
        <p className="text-muted-foreground text-center text-sm">
          No active sessions found.
        </p>
      )}
    </div>
  );
}
