import { integrations } from "@gmacko/config";
import { createLogger } from "@gmacko/logging";

const log = createLogger({ module: "realtime" });

let redisClient: import("ioredis").default | null = null;
let subscriberClient: import("ioredis").default | null = null;

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

  if (!redisClient) {
    redisClient = await createRedisClient(config);
  }
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

  if (!subscriberClient) {
    subscriberClient = await createRedisClient();
  }

  await subscriberClient.subscribe(channel);

  const listener = (_ch: string, message: string) => {
    try {
      const parsed = JSON.parse(message) as {
        event: string;
        data: Record<string, unknown>;
      };
      handler(parsed.event, parsed.data);
    } catch {
      log.warn({ channel, message }, "failed to parse redis message");
    }
  };

  subscriberClient.on("message", listener);

  return async () => {
    subscriberClient?.off("message", listener);
    await subscriberClient?.unsubscribe(channel);
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

  return new Queue(name, { connection });
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

  return new Worker<T>(name, processor, { connection });
}

export async function shutdown(): Promise<void> {
  await redisClient?.quit();
  await subscriberClient?.quit();
  redisClient = null;
  subscriberClient = null;
}
