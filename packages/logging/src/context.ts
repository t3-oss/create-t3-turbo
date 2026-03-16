import { AsyncLocalStorage } from "node:async_hooks";

import type { LogContext } from "./index";

/**
 * AsyncLocalStorage-based request context for structured logging.
 *
 * This allows any code running within a request's call stack to access
 * the request's context (requestId, userId, etc.) without explicitly
 * threading it through every function call.
 *
 * Usage:
 *   // In middleware / request handler:
 *   await withRequestContext({ requestId, userId }, async () => {
 *     // Any code here can call getRequestContext()
 *     await handleRequest();
 *   });
 *
 *   // Deep in application code:
 *   const ctx = getRequestContext();
 *   logger.info({ ...ctx }, "something happened");
 */

const requestContextStorage = new AsyncLocalStorage<LogContext>();

/**
 * Run a function within a request context.
 * All code executed within `fn` (including async callbacks) will have
 * access to the context via `getRequestContext()`.
 */
export function withRequestContext<T>(
  context: LogContext,
  fn: () => T,
): T {
  return requestContextStorage.run(context, fn);
}

/**
 * Get the current request context, if any.
 * Returns an empty object if called outside a request context.
 */
export function getRequestContext(): LogContext {
  return requestContextStorage.getStore() ?? {};
}

/**
 * Update the current request context with additional fields.
 * Useful for adding userId after authentication resolves within the same request.
 */
export function updateRequestContext(updates: Partial<LogContext>): void {
  const current = requestContextStorage.getStore();
  if (current) {
    Object.assign(current, updates);
  }
}
