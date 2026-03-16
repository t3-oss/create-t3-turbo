import pino from "pino";

import { integrations } from "@gmacko/config";

export {
  withRequestContext,
  getRequestContext,
  updateRequestContext,
} from "./context";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

// ============================================================================
// Sentry Integration (Lazy Loading)
// ============================================================================

/**
 * Minimal Sentry interface for type safety without hard dependency
 * This allows the logging package to work without @sentry/nextjs installed
 */
interface SentryLike {
  addBreadcrumb: (breadcrumb: {
    message?: string;
    category?: string;
    level?: string;
    data?: Record<string, unknown>;
    timestamp?: number;
  }) => void;
  setUser: (user: Record<string, unknown> | null) => void;
  setContext: (name: string, context: Record<string, unknown> | null) => void;
  setTag: (key: string, value: string) => void;
  captureException: (error: unknown) => void;
  captureMessage: (message: string) => void;
  withScope: (callback: (scope: SentryScope) => void) => void;
  startInactiveSpan: (options: {
    name: string;
    op: string;
    attributes?: Record<string, string | number | boolean>;
  }) => SentrySpan | undefined;
}

interface SentryScope {
  setExtra: (key: string, value: unknown) => void;
  setLevel: (level: string) => void;
  setFingerprint: (fingerprint: string[]) => void;
  setTag: (key: string, value: string) => void;
}

interface SentrySpan {
  end: () => void;
  setAttribute: (key: string, value: string | number | boolean) => void;
  setStatus: (status: { code: number }) => void;
}

/**
 * Sentry integration state - lazily loaded
 */
let sentryModule: SentryLike | null = null;
let sentryLoadAttempted = false;

/**
 * Lazily load Sentry module
 * Tries @sentry/nextjs first (web), falls back gracefully
 */
async function getSentry(): Promise<SentryLike | null> {
  if (!integrations.sentry) return null;
  if (sentryLoadAttempted) return sentryModule;

  sentryLoadAttempted = true;
  try {
    // Try to load @sentry/nextjs (web environment)
    // Using dynamic import to avoid bundling if not available
    const sentry = await import("@sentry/nextjs");
    sentryModule = sentry as unknown as SentryLike;
    return sentryModule;
  } catch {
    // Sentry not available in this environment
    return null;
  }
}

// ============================================================================
// Base Logger Setup
// ============================================================================

const isDev = process.env.NODE_ENV !== "production";

/**
 * Create the base pino logger instance
 */
function createBaseLogger() {
  return pino({
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),

    // Add standard fields
    base: {
      env: process.env.NODE_ENV ?? "development",
      service: process.env.SERVICE_NAME ?? "gmacko-app",
      version: process.env.npm_package_version ?? "0.0.0",
    },

    // Timestamp format
    timestamp: pino.stdTimeFunctions.isoTime,

    // Pretty print in development
    transport: isDev
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss",
            ignore: "pid,hostname",
          },
        }
      : undefined,

    // Redact sensitive fields
    redact: {
      paths: [
        "password",
        "secret",
        "token",
        "apiKey",
        "authorization",
        "cookie",
        "*.password",
        "*.secret",
        "*.token",
        "*.apiKey",
      ],
      censor: "[REDACTED]",
    },
  });
}

const baseLogger = createBaseLogger();

/**
 * Create a child logger with additional context.
 * Automatically merges in the current AsyncLocalStorage request context
 * so callers don't need to explicitly pass requestId/userId.
 */
export function createLogger(context: LogContext = {}) {
  // Lazy import to avoid circular deps at module load time
  let requestContext: LogContext = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require("./context") as {
      getRequestContext: () => LogContext;
    };
    requestContext = getRequestContext();
  } catch {
    // context module not available (e.g., edge runtime without node:async_hooks)
  }
  return baseLogger.child({ ...requestContext, ...context });
}

/**
 * Default logger instance
 */
export const logger = baseLogger;

// ============================================================================
// Sentry Integration Utilities
// ============================================================================

/**
 * Breadcrumb category types for better organization in Sentry
 */
export type BreadcrumbCategory =
  | "http"
  | "navigation"
  | "user"
  | "query"
  | "ui"
  | "console"
  | "default";

/**
 * Sentry severity level mapping
 */
type SentrySeverity = "fatal" | "error" | "warning" | "info" | "debug";

function mapLogLevelToSentry(level: LogLevel): SentrySeverity {
  switch (level) {
    case "fatal":
      return "fatal";
    case "error":
      return "error";
    case "warn":
      return "warning";
    case "info":
      return "info";
    case "trace":
    case "debug":
    default:
      return "debug";
  }
}

/**
 * Add a breadcrumb to Sentry for context building
 * Breadcrumbs help trace the path to an error
 */
export async function addBreadcrumb(
  message: string,
  options: {
    category?: BreadcrumbCategory;
    level?: LogLevel;
    data?: Record<string, unknown>;
  } = {},
): Promise<void> {
  const sentry = await getSentry();
  if (!sentry) return;

  sentry.addBreadcrumb({
    message,
    category: options.category ?? "default",
    level: mapLogLevelToSentry(options.level ?? "info"),
    data: options.data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Set user context for Sentry events
 */
export async function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}): Promise<void> {
  const sentry = await getSentry();
  if (!sentry) return;

  const { id, email, username, ...rest } = user;
  sentry.setUser({
    id,
    email,
    username,
    ...rest,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export async function clearUserContext(): Promise<void> {
  const sentry = await getSentry();
  if (!sentry) return;

  sentry.setUser(null);
}

/**
 * Set custom context/tags for Sentry events
 */
export async function setSentryContext(
  name: string,
  context: Record<string, unknown>,
): Promise<void> {
  const sentry = await getSentry();
  if (!sentry) return;

  sentry.setContext(name, context);
}

/**
 * Set a tag on all future Sentry events
 */
export async function setSentryTag(
  key: string,
  value: string | number | boolean,
): Promise<void> {
  const sentry = await getSentry();
  if (!sentry) return;

  sentry.setTag(key, String(value));
}

// ============================================================================
// Enhanced Logging Functions with Sentry Integration
// ============================================================================

/**
 * Request logger middleware context
 */
export function createRequestLogger(
  requestId: string,
  additionalContext: LogContext = {},
) {
  return createLogger({
    requestId,
    ...additionalContext,
  });
}

/**
 * Log and capture error to Sentry if enabled
 * Automatically sends error/fatal level logs to Sentry
 */
export async function logError(
  error: Error,
  context: LogContext = {},
  options: {
    captureToSentry?: boolean;
    level?: "error" | "fatal";
    fingerprint?: string[];
  } = {},
): Promise<void> {
  const { captureToSentry = true, level = "error", fingerprint } = options;
  const errorLogger = createLogger(context);

  errorLogger[level](
    {
      err: error,
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
    },
    error.message,
  );

  // Capture to Sentry if enabled
  if (captureToSentry) {
    const sentry = await getSentry();
    if (sentry) {
      sentry.withScope((scope) => {
        // Add context as extra data
        for (const [key, value] of Object.entries(context)) {
          scope.setExtra(key, value);
        }

        // Set level
        scope.setLevel(level);

        // Custom fingerprint for grouping
        if (fingerprint) {
          scope.setFingerprint(fingerprint);
        }

        // Add request ID as tag if present
        if (context.requestId) {
          scope.setTag("requestId", String(context.requestId));
        }

        // Add user ID as tag if present
        if (context.userId) {
          scope.setTag("userId", String(context.userId));
        }

        sentry.captureException(error);
      });
    }
  }
}

/**
 * Log a warning with optional Sentry breadcrumb
 */
export async function logWarning(
  message: string,
  context: LogContext = {},
  addAsBreadcrumb = true,
): Promise<void> {
  const warnLogger = createLogger(context);
  warnLogger.warn(context, message);

  if (addAsBreadcrumb) {
    await addBreadcrumb(message, {
      category: "console",
      level: "warn",
      data: context,
    });
  }
}

/**
 * Log info with optional Sentry breadcrumb
 */
export async function logInfo(
  message: string,
  context: LogContext = {},
  addAsBreadcrumb = true,
): Promise<void> {
  const infoLogger = createLogger(context);
  infoLogger.info(context, message);

  if (addAsBreadcrumb) {
    await addBreadcrumb(message, {
      category: "console",
      level: "info",
      data: context,
    });
  }
}

/**
 * Log debug (no Sentry breadcrumb by default to reduce noise)
 */
export function logDebug(message: string, context: LogContext = {}): void {
  const debugLogger = createLogger(context);
  debugLogger.debug(context, message);
}

/**
 * Log API request/response with Sentry breadcrumb
 */
export async function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  context: LogContext = {},
): Promise<void> {
  const requestLogger = createLogger(context);

  const level: LogLevel =
    statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

  const logData = {
    method,
    path,
    statusCode,
    durationMs,
  };

  requestLogger[level](
    logData,
    `${method} ${path} ${statusCode} ${durationMs}ms`,
  );

  // Add HTTP breadcrumb for non-successful requests
  if (statusCode >= 400) {
    await addBreadcrumb(`${method} ${path} - ${statusCode}`, {
      category: "http",
      level,
      data: {
        ...logData,
        ...context,
      },
    });
  }

  // Capture 5xx errors to Sentry
  if (statusCode >= 500) {
    const sentry = await getSentry();
    if (sentry) {
      sentry.withScope((scope) => {
        scope.setLevel("error");
        scope.setTag("http.method", method);
        scope.setTag("http.path", path);
        scope.setTag("http.status_code", statusCode.toString());
        scope.setExtra("durationMs", durationMs);
        scope.setExtra("context", context);

        sentry.captureMessage(`HTTP ${statusCode}: ${method} ${path}`);
      });
    }
  }
}

/**
 * Log database query with breadcrumb
 */
export async function logDbQuery(
  query: string,
  durationMs: number,
  context: LogContext = {},
  options: {
    slow_threshold_ms?: number;
  } = {},
): Promise<void> {
  const { slow_threshold_ms = 1000 } = options;
  const dbLogger = createLogger({ ...context, component: "database" });

  const truncatedQuery = query.substring(0, 200);
  const isSlow = durationMs > slow_threshold_ms;

  if (isSlow) {
    dbLogger.warn(
      {
        query: truncatedQuery,
        durationMs,
        slow: true,
      },
      `Slow DB query: ${durationMs}ms`,
    );

    // Add breadcrumb for slow queries
    await addBreadcrumb(`Slow query: ${durationMs}ms`, {
      category: "query",
      level: "warn",
      data: {
        query: truncatedQuery,
        durationMs,
      },
    });
  } else {
    dbLogger.debug(
      {
        query: truncatedQuery,
        durationMs,
      },
      `DB query: ${durationMs}ms`,
    );
  }
}

// ============================================================================
// Request Logging Middleware Helpers
// ============================================================================

/**
 * Options for request logging middleware
 */
export interface RequestLoggingOptions {
  /** Skip logging for certain paths (e.g., health checks) */
  ignorePaths?: string[];
  /** Include request headers in logs (be careful with sensitive data) */
  logHeaders?: boolean;
  /** Include response body size */
  logBodySize?: boolean;
  /** Slow request threshold in ms */
  slowRequestThresholdMs?: number;
}

/**
 * Request context type for middleware
 */
export interface RequestInfo {
  method: string;
  path: string;
  url: string;
  headers?: Record<string, string>;
  userAgent?: string;
  ip?: string;
}

/**
 * Response context type for middleware
 */
export interface ResponseInfo {
  statusCode: number;
  durationMs: number;
  bodySize?: number;
}

/**
 * Create a request logging handler for middleware
 * Returns functions to call at request start and end
 */
export function createRequestLoggingHandler(
  options: RequestLoggingOptions = {},
) {
  const {
    ignorePaths = ["/health", "/healthz", "/_health", "/api/health"],
    slowRequestThresholdMs = 3000,
  } = options;

  return {
    /**
     * Call at request start - sets up context and adds navigation breadcrumb
     */
    onRequestStart: async (
      requestId: string,
      request: RequestInfo,
      context: LogContext = {},
    ) => {
      // Skip ignored paths
      const shouldIgnore = ignorePaths.some(
        (p) => request.path.startsWith(p),
      );
      if (shouldIgnore) {
        return null;
      }

      const requestLogger = createRequestLogger(requestId, {
        ...context,
        method: request.method,
        path: request.path,
        userAgent: request.userAgent,
        ip: request.ip,
      });

      requestLogger.debug(
        {
          url: request.url,
          headers: options.logHeaders ? request.headers : undefined,
        },
        `-> ${request.method} ${request.path}`,
      );

      // Add navigation breadcrumb
      await addBreadcrumb(`${request.method} ${request.path}`, {
        category: "navigation",
        level: "info",
        data: {
          url: request.url,
          method: request.method,
        },
      });

      return {
        requestLogger,
        startTime: Date.now(),
      };
    },

    /**
     * Call at request end - logs response and captures errors
     */
    onRequestEnd: async (
      requestId: string,
      request: RequestInfo,
      response: ResponseInfo,
      context: LogContext = {},
    ) => {
      // Skip ignored paths
      const shouldIgnore = ignorePaths.some(
        (p) => request.path.startsWith(p),
      );
      if (shouldIgnore) {
        return;
      }

      await logApiRequest(
        request.method,
        request.path,
        response.statusCode,
        response.durationMs,
        {
          requestId,
          ...context,
          bodySize: response.bodySize,
        },
      );

      // Warn about slow requests
      if (response.durationMs > slowRequestThresholdMs) {
        const sentry = await getSentry();
        if (sentry) {
          sentry.withScope((scope) => {
            scope.setLevel("warning");
            scope.setTag("slow_request", "true");
            scope.setTag("http.method", request.method);
            scope.setTag("http.path", request.path);
            scope.setExtra("durationMs", response.durationMs);
            scope.setExtra("threshold", slowRequestThresholdMs);

            sentry.captureMessage(
              `Slow request: ${request.method} ${request.path} took ${response.durationMs}ms`,
            );
          });
        }
      }
    },

    /**
     * Call when request errors
     */
    onRequestError: async (
      requestId: string,
      request: RequestInfo,
      error: Error,
      context: LogContext = {},
    ) => {
      await logError(error, {
        requestId,
        method: request.method,
        path: request.path,
        url: request.url,
        ...context,
      });
    },
  };
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Transaction/Span Helpers for Performance Monitoring
// ============================================================================

/**
 * Start a Sentry transaction for performance monitoring
 */
export async function startTransaction(
  name: string,
  op: string,
  data?: Record<string, unknown>,
): Promise<{
  finish: () => void;
  setData: (key: string, value: unknown) => void;
  setStatus: (status: "ok" | "error" | "cancelled") => void;
} | null> {
  const sentry = await getSentry();
  if (!sentry) {
    return null;
  }

  const attributes: Record<string, string | number | boolean> = {};
  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        attributes[key] = value;
      }
    }
  }

  const span = sentry.startInactiveSpan({
    name,
    op,
    attributes,
  });

  if (!span) return null;

  return {
    finish: () => span.end(),
    setData: (key, value) => {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        span.setAttribute(key, value);
      }
    },
    setStatus: (status) => {
      const statusMap = {
        ok: { code: 1 },
        error: { code: 2 },
        cancelled: { code: 2 },
      };
      span.setStatus(statusMap[status]);
    },
  };
}

/**
 * Wrap an async function with Sentry performance monitoring
 */
export async function withPerformanceTracking<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
): Promise<T> {
  const transaction = await startTransaction(name, op);

  try {
    const result = await fn();
    transaction?.setStatus("ok");
    return result;
  } catch (error) {
    transaction?.setStatus("error");
    throw error;
  } finally {
    transaction?.finish();
  }
}

export type { Logger } from "pino";
export { pino };
