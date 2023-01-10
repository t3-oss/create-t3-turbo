import React from "react";
import { getSession, logger, __NEXTAUTH } from "./client";
import {
  SessionContextValue,
  SessionProviderProps,
  UseSessionOptions,
} from "./types";

const SessionContext = React.createContext<SessionContextValue | undefined>(
  undefined,
);

/**
 * React Hook that gives you access
 * to the logged in user's session data.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#usesession)
 */
export function useSession(options?: UseSessionOptions) {
  // @ts-expect-error Satisfy TS if branch on line below
  const value: SessionContextValue = React.useContext(SessionContext);
  if (!value && process.env.NODE_ENV !== "production") {
    throw new Error(
      "[next-auth]: `useSession` must be wrapped in a <SessionProvider />",
    );
  }

  const { onUnauthenticated } = options ?? {};

  const unauthenticated = value.status === "unauthenticated";

  React.useEffect(() => {
    if (unauthenticated) {
      if (onUnauthenticated) onUnauthenticated();
    }
  }, [unauthenticated, onUnauthenticated]);

  return value;
}

/**
 * Provider to wrap the app in to make session data available globally.
 * Can also be used to throttle the number of requests to the endpoint
 * `/api/auth/session`.
 *
 * [Documentation](https://next-auth.js.org/getting-started/client#sessionprovider)
 */
export function SessionProvider(props: SessionProviderProps) {
  const { children, basePath, refetchInterval, baseUrl } = props;

  if (baseUrl) {
    __NEXTAUTH.baseUrl = baseUrl;
    __NEXTAUTH.baseUrlServer = baseUrl;
  }
  if (basePath) {
    __NEXTAUTH.basePath = basePath;
    __NEXTAUTH.basePathServer = basePath;
  }

  /**
   * If session was `null`, there was an attempt to fetch it,
   * but it failed, but we still treat it as a valid initial value.
   */
  const hasInitialSession = props.session !== undefined;

  /** If session was passed, initialize as already synced */
  __NEXTAUTH._lastSync = hasInitialSession ? Math.floor(Date.now() / 1000) : 0;

  const [session, setSession] = React.useState(() => {
    if (hasInitialSession) __NEXTAUTH._session = props.session;
    return props.session;
  });

  /** If session was passed, initialize as not loading */
  const [loading, setLoading] = React.useState(!hasInitialSession);

  React.useEffect(() => {
    __NEXTAUTH._getSession = async ({ event } = {}) => {
      try {
        const storageEvent = event === "storage";
        // We should always update if we don't have a client session yet
        // or if there are events from other tabs/windows
        if (storageEvent || __NEXTAUTH._session === undefined) {
          __NEXTAUTH._lastSync = Math.floor(Date.now() / 1000);
          __NEXTAUTH._session = await getSession();
          setSession(__NEXTAUTH._session);
          return;
        }

        if (
          // If there is no time defined for when a session should be considered
          // stale, then it's okay to use the value we have until an event is
          // triggered which updates it
          !event ||
          // If the client doesn't have a session then we don't need to call
          // the server to check if it does (if they have signed in via another
          // tab or window that will come through as a "stroage" event
          // event anyway)
          __NEXTAUTH._session === null ||
          // Bail out early if the client session is not stale yet
          Math.floor(Date.now() / 1000) < __NEXTAUTH._lastSync
        ) {
          return;
        }

        // An event or session staleness occurred, update the client session.
        __NEXTAUTH._lastSync = Math.floor(Date.now() / 1000);
        __NEXTAUTH._session = await getSession();
        setSession(__NEXTAUTH._session);
      } catch (error) {
        logger.error("CLIENT_SESSION_ERROR", error as Error);
      } finally {
        setLoading(false);
      }
    };

    __NEXTAUTH._getSession();

    return () => {
      __NEXTAUTH._lastSync = 0;
      __NEXTAUTH._session = undefined;
      __NEXTAUTH._getSession = () => {
        /** no-op */
      };
    };
  }, []);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     const { refetchOnWindowFocus = true } = props
  //     // Listen for when the page is visible, if the user switches tabs
  //     // and makes our tab visible again, re-fetch the session, but only if
  //     // this feature is not disabled.
  //     if (refetchOnWindowFocus)
  //       __NEXTAUTH._getSession({ event: "visibilitychange" })
  //   }, [props])
  // )

  React.useEffect(() => {
    // Set up polling
    if (refetchInterval) {
      const refetchIntervalTimer = setInterval(() => {
        if (__NEXTAUTH._session) {
          __NEXTAUTH._getSession({ event: "poll" });
        }
      }, refetchInterval * 1000);
      return () => clearInterval(refetchIntervalTimer);
    }
  }, [refetchInterval]);

  const value = React.useMemo(
    () => ({
      data: session,
      status: loading
        ? "loading"
        : session
        ? "authenticated"
        : "unauthenticated",
    }),
    [session, loading],
  );

  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    <SessionContext.Provider value={value as any}>
      {children}
    </SessionContext.Provider>
  );
}
