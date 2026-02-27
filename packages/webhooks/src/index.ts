/**
 * @gmacko/webhooks — Webhook Delivery System
 *
 * Enables your SaaS to send webhooks to customer-configured endpoints.
 * Supports HMAC-SHA256 signatures, exponential backoff retries, and
 * delivery status tracking.
 *
 * Usage:
 *   import { sendWebhook, registerEndpoint } from "@gmacko/webhooks";
 *
 *   // Register an endpoint
 *   const endpoint = await registerEndpoint({
 *     url: "https://example.com/webhook",
 *     events: ["user.created", "subscription.updated"],
 *     organizationId: org.id,
 *   });
 *
 *   // Send a webhook event
 *   await sendWebhook("user.created", { userId: "123", email: "..." });
 */

import { createHmac, randomBytes } from "node:crypto";

import { createLogger } from "@gmacko/logging";
import { enqueueJob, jobHandlers } from "@gmacko/jobs";

const logger = createLogger({ component: "webhooks" });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WebhookEndpoint {
  id: string;
  organizationId?: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: Date;
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: string;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  maxAttempts: number;
  responseCode: number | null;
  responseBody: string | null;
  lastError: string | null;
  nextRetryAt: Date | null;
  createdAt: Date;
  deliveredAt: Date | null;
}

export interface RegisterEndpointOptions {
  url: string;
  events: string[];
  organizationId?: string;
}

export interface WebhookConfig {
  /** Signing secret prefix (default: "whsec_") */
  secretPrefix?: string;
  /** Max delivery attempts (default: 5) */
  maxAttempts?: number;
  /** Retry backoff intervals in ms (default: [60s, 5m, 30m, 2h, 24h]) */
  retryIntervals?: number[];
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
  /** Custom User-Agent header */
  userAgent?: string;
}

// ─── In-Memory Store (replace with DB for production) ────────────────────────

const endpoints = new Map<string, WebhookEndpoint>();
const deliveries = new Map<string, WebhookDelivery>();

// ─── Configuration ───────────────────────────────────────────────────────────

const DEFAULT_CONFIG: Required<WebhookConfig> = {
  secretPrefix: "whsec_",
  maxAttempts: 5,
  retryIntervals: [60_000, 300_000, 1_800_000, 7_200_000, 86_400_000],
  timeoutMs: 30_000,
  userAgent: "Gmacko-Webhooks/1.0",
};

let config: Required<WebhookConfig> = { ...DEFAULT_CONFIG };

/**
 * Configure the webhook system.
 */
export function configureWebhooks(options: WebhookConfig): void {
  config = { ...DEFAULT_CONFIG, ...options };
}

// ─── Signing ─────────────────────────────────────────────────────────────────

/**
 * Generate a signing secret for a webhook endpoint.
 */
export function generateSecret(): string {
  return `${config.secretPrefix}${randomBytes(32).toString("hex")}`;
}

/**
 * Sign a webhook payload using HMAC-SHA256.
 * Returns a signature in the format: t=<timestamp>,v1=<signature>
 */
export function signPayload(
  payload: string,
  secret: string,
  timestamp?: number,
): string {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const signedContent = `${ts}.${payload}`;
  const signature = createHmac("sha256", secret)
    .update(signedContent)
    .digest("hex");
  return `t=${ts},v1=${signature}`;
}

/**
 * Verify a webhook signature.
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  const parts = signature.split(",");
  const tsPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));

  if (!tsPart || !sigPart) return false;

  const timestamp = parseInt(tsPart.slice(2), 10);
  const expectedSig = sigPart.slice(3);

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) return false;

  // Verify signature
  const signedContent = `${timestamp}.${payload}`;
  const computedSig = createHmac("sha256", secret)
    .update(signedContent)
    .digest("hex");

  // Timing-safe comparison
  if (computedSig.length !== expectedSig.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computedSig.length; i++) {
    mismatch |= computedSig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0;
}

// ─── Endpoint Management ─────────────────────────────────────────────────────

/**
 * Register a new webhook endpoint.
 */
export async function registerEndpoint(
  options: RegisterEndpointOptions,
): Promise<WebhookEndpoint> {
  const id = `we_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
  const secret = generateSecret();

  const endpoint: WebhookEndpoint = {
    id,
    organizationId: options.organizationId,
    url: options.url,
    secret,
    events: options.events,
    active: true,
    createdAt: new Date(),
  };

  endpoints.set(id, endpoint);

  logger.info(
    { endpointId: id, url: options.url, events: options.events },
    "Webhook endpoint registered",
  );

  return endpoint;
}

/**
 * Deactivate a webhook endpoint.
 */
export async function deactivateEndpoint(id: string): Promise<void> {
  const endpoint = endpoints.get(id);
  if (endpoint) {
    endpoint.active = false;
    logger.info({ endpointId: id }, "Webhook endpoint deactivated");
  }
}

/**
 * Delete a webhook endpoint.
 */
export async function deleteEndpoint(id: string): Promise<void> {
  endpoints.delete(id);
  logger.info({ endpointId: id }, "Webhook endpoint deleted");
}

/**
 * List all registered webhook endpoints.
 */
export async function listEndpoints(
  organizationId?: string,
): Promise<WebhookEndpoint[]> {
  const all = Array.from(endpoints.values());
  if (organizationId) {
    return all.filter((e) => e.organizationId === organizationId);
  }
  return all;
}

// ─── Delivery ────────────────────────────────────────────────────────────────

/**
 * Send a webhook event to all subscribed endpoints.
 * Events are delivered asynchronously via the job queue.
 */
export async function sendWebhook(
  event: string,
  payload: Record<string, unknown>,
  organizationId?: string,
): Promise<string[]> {
  const subscribed = Array.from(endpoints.values()).filter(
    (e) =>
      e.active &&
      (e.events.includes(event) || e.events.includes("*")) &&
      (!organizationId || e.organizationId === organizationId),
  );

  const deliveryIds: string[] = [];

  for (const endpoint of subscribed) {
    const deliveryId = `wd_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;

    const delivery: WebhookDelivery = {
      id: deliveryId,
      endpointId: endpoint.id,
      event,
      payload,
      status: "pending",
      attempts: 0,
      maxAttempts: config.maxAttempts,
      responseCode: null,
      responseBody: null,
      lastError: null,
      nextRetryAt: null,
      createdAt: new Date(),
      deliveredAt: null,
    };

    deliveries.set(deliveryId, delivery);

    await enqueueJob("webhook.deliver", {
      deliveryId,
      endpointId: endpoint.id,
      url: endpoint.url,
      secret: endpoint.secret,
      event,
      payload,
    });

    deliveryIds.push(deliveryId);
  }

  if (subscribed.length > 0) {
    logger.info(
      { event, endpointCount: subscribed.length },
      `Webhook event dispatched: ${event}`,
    );
  }

  return deliveryIds;
}

/**
 * Get delivery status for a specific delivery.
 */
export async function getDelivery(
  deliveryId: string,
): Promise<WebhookDelivery | undefined> {
  return deliveries.get(deliveryId);
}

/**
 * List recent deliveries for an endpoint.
 */
export async function listDeliveries(
  endpointId: string,
  limit = 50,
): Promise<WebhookDelivery[]> {
  return Array.from(deliveries.values())
    .filter((d) => d.endpointId === endpointId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

// ─── Job Handler ─────────────────────────────────────────────────────────────

/**
 * Register the webhook delivery job handler.
 * Call this once at app startup.
 */
export function registerWebhookJobHandler(): void {
  jobHandlers.set(
    "webhook.deliver",
    async (jobPayload: Record<string, unknown>) => {
      const { deliveryId, url, secret, event, payload } = jobPayload as {
        deliveryId: string;
        url: string;
        secret: string;
        event: string;
        payload: Record<string, unknown>;
      };

      const delivery = deliveries.get(deliveryId);
      if (!delivery) {
        logger.warn({ deliveryId }, "Webhook delivery not found");
        return;
      }

      delivery.attempts++;

      const body = JSON.stringify({
        event,
        data: payload,
        timestamp: new Date().toISOString(),
      });

      const signature = signPayload(body, secret);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(
          () => controller.abort(),
          config.timeoutMs,
        );

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": config.userAgent,
            "X-Webhook-Event": event,
            "X-Webhook-Signature": signature,
            "X-Webhook-Delivery": deliveryId,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        delivery.responseCode = response.status;

        if (response.ok) {
          delivery.status = "delivered";
          delivery.deliveredAt = new Date();
          logger.info(
            { deliveryId, url, event, statusCode: response.status },
            "Webhook delivered",
          );
        } else {
          const responseText = await response.text().catch(() => "");
          delivery.responseBody = responseText.substring(0, 1000);
          throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 200)}`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        delivery.lastError = message;

        if (delivery.attempts >= delivery.maxAttempts) {
          delivery.status = "failed";
          logger.error(
            { deliveryId, url, event, attempts: delivery.attempts, error: message },
            "Webhook delivery failed permanently",
          );
        } else {
          // Schedule retry with exponential backoff
          const retryDelay =
            config.retryIntervals[delivery.attempts - 1] ??
            config.retryIntervals[config.retryIntervals.length - 1]!;
          delivery.nextRetryAt = new Date(Date.now() + retryDelay);

          await enqueueJob(
            "webhook.deliver",
            jobPayload,
            { scheduledFor: delivery.nextRetryAt },
          );

          logger.warn(
            {
              deliveryId,
              url,
              event,
              attempt: delivery.attempts,
              nextRetry: delivery.nextRetryAt.toISOString(),
              error: message,
            },
            "Webhook delivery failed, scheduling retry",
          );
        }
      }
    },
  );
}
