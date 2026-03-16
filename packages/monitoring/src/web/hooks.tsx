"use client";

import { useEffect, useRef } from "react";
import * as Sentry from "@sentry/nextjs";

import { integrations } from "@gmacko/config";

/**
 * Set the Sentry user context when authentication state changes.
 * Place in your providers or layout component.
 */
export function useSentryUser(
  user: { id: string; email?: string; name?: string } | null,
) {
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!integrations.sentry) return;

    if (user && user.id !== prevUserId.current) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
      prevUserId.current = user.id;
    } else if (!user && prevUserId.current) {
      Sentry.setUser(null);
      prevUserId.current = null;
    }
  }, [user]);
}

/**
 * Add breadcrumbs for user interactions.
 * Returns a callback to add navigation/click breadcrumbs.
 */
export function useSentryBreadcrumb() {
  return (message: string, data?: Record<string, unknown>) => {
    if (!integrations.sentry) return;

    Sentry.addBreadcrumb({
      category: "ui",
      message,
      data,
      level: "info",
    });
  };
}

/**
 * Track performance of a specific operation.
 * Returns start/finish callbacks for custom spans.
 */
export function useSentryTransaction(name: string, op: string) {
  const spanRef = useRef<ReturnType<typeof Sentry.startInactiveSpan> | null>(
    null,
  );

  const start = () => {
    if (!integrations.sentry) return;
    spanRef.current = Sentry.startInactiveSpan({ name, op });
  };

  const finish = (status: "ok" | "error" = "ok") => {
    if (!integrations.sentry || !spanRef.current) return;
    spanRef.current.setStatus({ code: status === "ok" ? 1 : 2 });
    spanRef.current.end();
    spanRef.current = null;
  };

  return { start, finish };
}

/**
 * Set tags for the current scope to help filter errors.
 */
export function useSentryTags(tags: Record<string, string>) {
  useEffect(() => {
    if (!integrations.sentry) return;

    Sentry.getCurrentScope().setTags(tags);
  }, [tags]);
}
