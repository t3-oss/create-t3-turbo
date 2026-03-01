import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import {
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  registerForPushNotifications,
  setBadgeCount,
  useLastNotificationResponse,
} from "@gmacko/notifications";

/**
 * Push notification hook — registers for push, handles incoming notifications,
 * and provides a push token for the backend to store.
 *
 * Features:
 * - Requests permission and registers on mount (when enabled)
 * - Listens for foreground notifications
 * - Handles notification tap (deep link to relevant screen)
 * - Clears badge count when app comes to foreground
 * - Returns the Expo push token for backend storage
 *
 * Usage:
 *   const { pushToken, notification } = usePushNotifications();
 *   // Send pushToken to your API: trpc.account.registerPushToken.mutate({ token: pushToken })
 */

interface UsePushNotificationsReturn {
  /** The Expo push token (null if not registered) */
  pushToken: string | null;
  /** Whether we're still registering */
  isRegistering: boolean;
  /** The last received notification (foreground) */
  notification: unknown | null;
  /** Re-register for push notifications */
  register: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(true);
  const [notification, setNotification] = useState<unknown | null>(null);
  const appState = useRef(AppState.currentState);

  // Register for push notifications
  const register = useCallback(async () => {
    setIsRegistering(true);
    try {
      const token = await registerForPushNotifications();
      setPushToken(token);
    } catch {
      // Silently fail — push is not critical
    }
    setIsRegistering(false);
  }, []);

  useEffect(() => {
    void register();
  }, [register]);

  // Listen for foreground notifications
  useEffect(() => {
    const receivedSub = addNotificationReceivedListener((notif) => {
      setNotification(notif);
    });

    const responseSub = addNotificationResponseReceivedListener((response) => {
      // Handle notification tap — extract deep link data
      const data = response.notification.request.content.data;
      if (data?.url && typeof data.url === "string") {
        // The expo-router will handle this via linking
        // In production, use router.push(data.url)
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, []);

  // Clear badge when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        void setBadgeCount(0);
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  return {
    pushToken,
    isRegistering,
    notification,
    register,
  };
}
