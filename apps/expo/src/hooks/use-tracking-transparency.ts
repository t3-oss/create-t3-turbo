import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
} from "expo-tracking-transparency";

/**
 * App Tracking Transparency hook — required by Apple for iOS 14.5+.
 *
 * Must be shown before initializing any tracking SDKs (PostHog, analytics, etc.).
 * This hook:
 * - Checks current ATT status on mount
 * - Provides `requestPermission()` to show the native prompt
 * - Returns whether tracking is authorized
 *
 * Apple App Store Review Guideline 5.1.2(i):
 * "Apps must use the AppTrackingTransparency framework to request the user's
 *  permission before collecting data used to track them."
 */

type TrackingStatus = "not-determined" | "restricted" | "denied" | "authorized";

interface UseTrackingTransparencyReturn {
  /** Whether tracking is authorized */
  isAuthorized: boolean;
  /** Current tracking permission status */
  status: TrackingStatus;
  /** Whether we're still checking */
  isLoading: boolean;
  /** Request tracking permission (shows native ATT dialog on iOS) */
  requestPermission: () => Promise<boolean>;
}

export function useTrackingTransparency(): UseTrackingTransparencyReturn {
  const [status, setStatus] = useState<TrackingStatus>("not-determined");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void checkStatus();
  }, []);

  async function checkStatus() {
    if (Platform.OS !== "ios") {
      // ATT is iOS-only; Android doesn't require it
      setStatus("authorized");
      setIsLoading(false);
      return;
    }

    try {
      const { status: currentStatus } =
        await getTrackingPermissionsAsync();
      setStatus(currentStatus as TrackingStatus);
    } catch {
      setStatus("not-determined");
    }

    setIsLoading(false);
  }

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== "ios") {
      setStatus("authorized");
      return true;
    }

    try {
      const { status: newStatus } =
        await requestTrackingPermissionsAsync();
      setStatus(newStatus as TrackingStatus);
      return newStatus === "granted";
    } catch {
      return false;
    }
  }, []);

  return {
    isAuthorized: status === "authorized",
    status,
    isLoading,
    requestPermission,
  };
}
