"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { identifyUser, resetUser, trackEvent } from "./index";

/**
 * Track page views automatically on route changes.
 * Place in your root layout or providers component.
 */
export function usePageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      const url = searchParams?.size
        ? `${pathname}?${searchParams.toString()}`
        : pathname;

      trackEvent("$pageview", {
        $current_url: url,
        path: pathname,
      });
    }
  }, [pathname, searchParams]);
}

/**
 * Identify the current user for analytics.
 * Call when the user signs in or on session hydration.
 */
export function useIdentifyUser(
  user: { id: string; email?: string; name?: string; role?: string } | null,
) {
  const prevUserId = useRef<string | null>(null);

  useEffect(() => {
    if (user && user.id !== prevUserId.current) {
      identifyUser(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
      prevUserId.current = user.id;
    } else if (!user && prevUserId.current) {
      resetUser();
      prevUserId.current = null;
    }
  }, [user]);
}

/**
 * Returns a stable callback to track events with consistent properties.
 */
export function useTrackEvent() {
  return useCallback(
    (eventName: string, properties?: Record<string, unknown>) => {
      trackEvent(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
      });
    },
    [],
  );
}

/**
 * Track how long a user spends on a page/component.
 */
export function useTimeOnPage(pageName: string) {
  const startTime = useRef(Date.now());

  useEffect(() => {
    startTime.current = Date.now();

    return () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 1) {
        trackEvent("time_on_page", {
          page: pageName,
          duration_seconds: duration,
        });
      }
    };
  }, [pageName]);
}

/**
 * Track conversion funnel steps.
 */
export function useTrackFunnel(funnelName: string) {
  return useCallback(
    (step: string, properties?: Record<string, unknown>) => {
      trackEvent("funnel_step", {
        funnel: funnelName,
        step,
        ...properties,
      });
    },
    [funnelName],
  );
}
