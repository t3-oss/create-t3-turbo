import { integrations } from "@gmacko/config";
import { createLogger } from "@gmacko/logging";

const log = createLogger({ module: "realtime" });

let redisClient: import("ioredis").default | null = null;
let redisInitPromise: Promise<import("ioredis").default> | null = null;
let subscriberClient: import("ioredis").default | null = null;
let subscriberInitPromise: Promise<import("ioredis").default> | null = null;
const channelRefCounts = new Map<string, number>();
const queues: import("bullmq").Queue[] = [];
const workers: import("bullmq").Worker[] = [];

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
}

function getRedisUrl(): string | undefined {
  return process.env.REDIS_URL;
}

async function createRedisClient(
  config: RedisConfig = {},
): Promise<import("ioredis").default> {
  const { default: Redis } = await import("ioredis");
  const url = config.url ?? getRedisUrl();
  if (url) {
    return new Redis(url, { maxRetriesPerRequest: null });
  }
  return new Redis({
    host: config.host ?? "localhost",
    port: config.port ?? 6379,
    password: config.password,
    db: config.db ?? 0,
    maxRetriesPerRequest: null,
  });
}

export async function initRedis(
  config: RedisConfig = {},
): Promise<import("ioredis").default | null> {
  if (!integrations.realtime.enabled) {
    log.debug("redis initialization skipped (integration disabled)");
    return null;
  }

  if (!redisInitPromise) {
    redisInitPromise = createRedisClient(config);
    redisInitPromise.catch(() => {
      redisInitPromise = null;
    });
  }
  redisClient = await redisInitPromise;
  return redisClient;
}

export function getRedis(): import("ioredis").default | null {
  if (!integrations.realtime.enabled) return null;
  return redisClient;
}

export async function publish(
  channel: string,
  event: string,
  data: Record<string, unknown>,
): Promise<boolean> {
  const client = getRedis();
  if (!client) {
    log.debug({ event }, "publish skipped (integration disabled)");
    return false;
  }

  await client.publish(channel, JSON.stringify({ event, data }));
  return true;
}

export async function subscribe(
  channel: string,
  handler: (event: string, data: Record<string, unknown>) => void,
): Promise<() => Promise<void>> {
  if (!integrations.realtime.enabled) {
    log.debug("subscribe skipped (integration disabled)");
    return async () => {};
  }

  if (!subscriberInitPromise) {
    subscriberInitPromise = createRedisClient();
    subscriberInitPromise.catch(() => {
      subscriberInitPromise = null;
    });
  }
  subscriberClient = await subscriberInitPromise;

  const refCount = channelRefCounts.get(channel) ?? 0;
  channelRefCounts.set(channel, refCount + 1);
  if (refCount === 0) {
    await subscriberClient.subscribe(channel);
  }

  const listener = (ch: string, message: string) => {
    if (ch !== channel) return;
    try {
      const parsed: unknown = JSON.parse(message);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof (parsed as Record<string, unknown>).event !== "string" ||
        typeof (parsed as Record<string, unknown>).data !== "object" ||
        (parsed as Record<string, unknown>).data === null
      ) {
        log.warn({ channel }, "invalid redis message shape");
        return;
      }
      const { event, data } = parsed as {
        event: string;
        data: Record<string, unknown>;
      };
      handler(event, data);
    } catch {
      log.warn({ channel }, "failed to parse redis message");
    }
  };

  subscriberClient.on("message", listener);

  return async () => {
    subscriberClient?.off("message", listener);
    const current = channelRefCounts.get(channel) ?? 1;
    if (current <= 1) {
      channelRefCounts.delete(channel);
      await subscriberClient?.unsubscribe(channel);
    } else {
      channelRefCounts.set(channel, current - 1);
    }
  };
}

export type { Job, Queue, Worker } from "bullmq";

export async function createQueue(
  name: string,
  config: RedisConfig = {},
): Promise<import("bullmq").Queue | null> {
  if (!integrations.realtime.enabled) {
    log.debug("queue creation skipped (integration disabled)");
    return null;
  }

  const { Queue } = await import("bullmq");
  const connection = await initRedis(config);
  if (!connection) return null;

  const queue = new Queue(name, { connection });
  queues.push(queue);
  return queue;
}

export async function createWorker<T = unknown>(
  name: string,
  processor: (job: import("bullmq").Job<T>) => Promise<void>,
  config: RedisConfig = {},
): Promise<import("bullmq").Worker<T> | null> {
  if (!integrations.realtime.enabled) {
    log.debug("worker creation skipped (integration disabled)");
    return null;
  }

  const { Worker } = await import("bullmq");
  const connection = await initRedis(config);
  if (!connection) return null;

  const worker = new Worker<T>(name, processor, { connection });
  workers.push(worker);
  return worker;
}

export async function shutdown(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  await Promise.all(queues.map((q) => q.close()));
  workers.length = 0;
  queues.length = 0;
  await subscriberClient?.quit();
  await redisClient?.quit();
  redisClient = null;
  redisInitPromise = null;
  subscriberClient = null;
  subscriberInitPromise = null;
  channelRefCounts.clear();
}
