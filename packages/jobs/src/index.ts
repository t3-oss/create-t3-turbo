/**
 * @gmacko/jobs — Lightweight Background Job System
 *
 * This provides a simple, type-safe background job pattern for common SaaS operations.
 * It uses a database-backed queue (the `job` table) with polling for processing.
 *
 * For production at scale, consider migrating to:
 * - Inngest (https://inngest.com) — event-driven, serverless-friendly
 * - Trigger.dev (https://trigger.dev) — full workflow engine
 * - BullMQ + Redis — classic Node.js job queue
 *
 * Usage:
 *   import { enqueueJob, processJobs, jobHandlers } from "@gmacko/jobs";
 *
 *   // Register handlers
 *   jobHandlers.set("email.welcome", async (payload) => {
 *     await sendEmail(welcomeEmail(payload));
 *   });
 *
 *   // Enqueue a job
 *   await enqueueJob("email.welcome", { name: "John", email: "john@example.com" });
 *
 *   // Process jobs (call from a cron or long-running process)
 *   await processJobs();
 */

export interface Job {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  scheduledFor: Date;
  createdAt: Date;
  completedAt: Date | null;
}

export type JobHandler = (
  payload: Record<string, unknown>,
) => Promise<void>;

/** Registry of job type → handler */
export const jobHandlers = new Map<string, JobHandler>();

/**
 * In-memory queue for environments without database access.
 * In production, replace with database-backed or Redis-backed queue.
 */
const memoryQueue: Job[] = [];
let processing = false;

/**
 * Enqueue a background job.
 *
 * @param type - Job type (e.g., "email.welcome", "stripe.sync")
 * @param payload - Job-specific data
 * @param options - Optional scheduling and retry config
 */
export async function enqueueJob(
  type: string,
  payload: Record<string, unknown>,
  options?: {
    /** Delay execution (defaults to immediate) */
    scheduledFor?: Date;
    /** Max retry attempts (defaults to 3) */
    maxAttempts?: number;
  },
): Promise<string> {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const job: Job = {
    id,
    type,
    payload,
    status: "pending",
    attempts: 0,
    maxAttempts: options?.maxAttempts ?? 3,
    lastError: null,
    scheduledFor: options?.scheduledFor ?? new Date(),
    createdAt: new Date(),
    completedAt: null,
  };

  memoryQueue.push(job);

  // Auto-process if not already running
  if (!processing) {
    void processJobs();
  }

  return id;
}

/**
 * Process pending jobs from the queue.
 * Call this from a cron endpoint, a long-running worker, or after enqueueing.
 */
export async function processJobs(
  options?: {
    /** Max jobs to process per batch */
    batchSize?: number;
  },
): Promise<{ processed: number; failed: number }> {
  if (processing) return { processed: 0, failed: 0 };
  processing = true;

  const batchSize = options?.batchSize ?? 10;
  let processed = 0;
  let failed = 0;

  try {
    const now = new Date();
    const pendingJobs = memoryQueue
      .filter(
        (j) =>
          j.status === "pending" &&
          j.scheduledFor <= now &&
          j.attempts < j.maxAttempts,
      )
      .slice(0, batchSize);

    for (const job of pendingJobs) {
      const handler = jobHandlers.get(job.type);
      if (!handler) {
        console.warn(`[Jobs] No handler for job type: ${job.type}`);
        job.status = "failed";
        job.lastError = `No handler registered for type: ${job.type}`;
        failed++;
        continue;
      }

      job.status = "processing";
      job.attempts++;

      try {
        await handler(job.payload);
        job.status = "completed";
        job.completedAt = new Date();
        processed++;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        job.lastError = message;

        if (job.attempts >= job.maxAttempts) {
          job.status = "failed";
          failed++;
          console.error(
            `[Jobs] Job ${job.id} (${job.type}) failed permanently: ${message}`,
          );
        } else {
          // Retry with exponential backoff
          job.status = "pending";
          job.scheduledFor = new Date(
            Date.now() + Math.pow(2, job.attempts) * 1000,
          );
          console.warn(
            `[Jobs] Job ${job.id} (${job.type}) failed, retrying in ${Math.pow(2, job.attempts)}s: ${message}`,
          );
        }
      }
    }
  } finally {
    processing = false;
  }

  return { processed, failed };
}

/**
 * Get the current queue status for monitoring.
 */
export function getQueueStatus(): {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
} {
  const counts = { pending: 0, processing: 0, completed: 0, failed: 0 };
  for (const job of memoryQueue) {
    counts[job.status]++;
  }
  return { ...counts, total: memoryQueue.length };
}

// ─── Pre-defined Job Types ──────────────────────────────────────────────────
// These serve as documentation and type hints for common SaaS jobs.

export const JOB_TYPES = {
  // Email jobs
  EMAIL_WELCOME: "email.welcome",
  EMAIL_VERIFICATION: "email.verification",
  EMAIL_PASSWORD_RESET: "email.password_reset",
  EMAIL_INVOICE: "email.invoice",
  EMAIL_SUBSCRIPTION_CONFIRMED: "email.subscription_confirmed",
  EMAIL_SUBSCRIPTION_CANCELLED: "email.subscription_cancelled",
  EMAIL_TEAM_INVITE: "email.team_invite",
  EMAIL_DATA_EXPORT: "email.data_export",

  // Stripe sync jobs
  STRIPE_SYNC_SUBSCRIPTION: "stripe.sync_subscription",
  STRIPE_SYNC_CUSTOMER: "stripe.sync_customer",

  // Data jobs
  DATA_EXPORT: "data.export",
  DATA_CLEANUP: "data.cleanup",

  // Audit jobs
  AUDIT_LOG: "audit.log",
} as const;
