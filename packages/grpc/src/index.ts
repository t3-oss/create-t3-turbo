/**
 * @gmacko/grpc — gRPC Service Definitions & Utilities
 *
 * Provides helpers for defining and consuming gRPC services in a multi-product
 * monorepo. Proto files define the contract, and this package provides
 * TypeScript-friendly wrappers for server and client creation.
 *
 * This is a STUB package — install @grpc/grpc-js and @grpc/proto-loader
 * as peer dependencies to activate.
 *
 * Usage:
 *   import { createGRPCServer, createGRPCClient, defineService } from "@gmacko/grpc";
 *
 *   // Define a service contract
 *   const UserService = defineService({
 *     name: "UserService",
 *     methods: {
 *       getUser: { request: "GetUserRequest", response: "GetUserResponse" },
 *       listUsers: { request: "ListUsersRequest", response: "ListUsersResponse", serverStreaming: true },
 *     },
 *   });
 *
 *   // Server
 *   const server = createGRPCServer({ port: 50051 });
 *   server.addService(UserService, {
 *     getUser: async (req) => ({ id: req.id, name: "John" }),
 *   });
 *
 *   // Client
 *   const client = createGRPCClient(UserService, { host: "localhost:50051" });
 *   const user = await client.getUser({ id: "123" });
 */

import { createLogger } from "@gmacko/logging";

const logger = createLogger({ component: "grpc" });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceMethod {
  request: string;
  response: string;
  clientStreaming?: boolean;
  serverStreaming?: boolean;
}

export interface ServiceDefinition {
  name: string;
  package?: string;
  methods: Record<string, ServiceMethod>;
}

export interface GRPCServerConfig {
  port?: number;
  host?: string;
  /** Path to .proto file (if using proto-loader) */
  protoPath?: string;
  /** Enable reflection for grpcurl/grpcui */
  reflection?: boolean;
}

export interface GRPCClientConfig {
  host: string;
  /** Use TLS (default: false for local, true for remote) */
  tls?: boolean;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
  /** Metadata/headers to send with every request */
  metadata?: Record<string, string>;
}

export interface GRPCServer {
  addService<T extends ServiceDefinition>(
    definition: T,
    implementation: Partial<Record<keyof T["methods"], (request: unknown) => Promise<unknown>>>,
  ): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface GRPCClient<T extends ServiceDefinition> {
  [K in keyof T["methods"]]: (request: unknown) => Promise<unknown>;
}

// ─── Service Definition Helper ───────────────────────────────────────────────

/**
 * Define a gRPC service contract.
 * This is a type-safe way to declare your service's methods without
 * writing .proto files manually.
 */
export function defineService<T extends ServiceDefinition>(definition: T): T {
  return definition;
}

// ─── Server Factory ──────────────────────────────────────────────────────────

/**
 * Create a gRPC server.
 *
 * Requires @grpc/grpc-js as a peer dependency.
 * Without it, returns a stub that logs warnings.
 */
export function createGRPCServer(config: GRPCServerConfig = {}): GRPCServer {
  const { port = 50051, host = "0.0.0.0" } = config;
  const services: Array<{ definition: ServiceDefinition; implementation: Record<string, unknown> }> = [];

  let grpcServer: unknown = null;

  return {
    addService(definition, implementation) {
      services.push({
        definition,
        implementation: implementation as Record<string, unknown>,
      });
      logger.info(
        { service: definition.name, methods: Object.keys(definition.methods) },
        `gRPC service registered: ${definition.name}`,
      );
    },

    async start() {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const grpc = require("@grpc/grpc-js") as typeof import("@grpc/grpc-js");
        const server = new grpc.Server();
        grpcServer = server;

        // For each service, we'd normally load proto definitions and bind.
        // This stub demonstrates the pattern — in production, use proto-loader
        // or ts-proto for full type generation.

        server.bindAsync(
          `${host}:${port}`,
          grpc.ServerCredentials.createInsecure(),
          (err) => {
            if (err) {
              logger.error({ err, port }, "Failed to start gRPC server");
              return;
            }
            logger.info(
              { port, host, services: services.map((s) => s.definition.name) },
              "gRPC server started",
            );
          },
        );
      } catch {
        logger.warn(
          "gRPC dependencies not installed. Install: pnpm add @grpc/grpc-js @grpc/proto-loader",
        );
        logger.info(
          { port, services: services.map((s) => s.definition.name) },
          "gRPC server running in stub mode",
        );
      }
    },

    async stop() {
      if (grpcServer && typeof (grpcServer as { forceShutdown: () => void }).forceShutdown === "function") {
        (grpcServer as { forceShutdown: () => void }).forceShutdown();
      }
      logger.info("gRPC server stopped");
    },
  };
}

// ─── Client Factory ──────────────────────────────────────────────────────────

/**
 * Create a gRPC client for a service.
 *
 * Requires @grpc/grpc-js as a peer dependency.
 * Without it, all method calls throw.
 */
export function createGRPCClient<T extends ServiceDefinition>(
  definition: T,
  config: GRPCClientConfig,
): Record<string, (request: unknown) => Promise<unknown>> {
  const { host, tls = false, timeoutMs = 30_000, metadata: defaultMetadata = {} } = config;

  logger.info(
    { service: definition.name, host, tls },
    `gRPC client created for ${definition.name}`,
  );

  // Return a proxy that creates method stubs
  const client: Record<string, (request: unknown) => Promise<unknown>> = {};

  for (const [methodName, methodDef] of Object.entries(definition.methods)) {
    client[methodName] = async (request: unknown) => {
      logger.debug(
        { service: definition.name, method: methodName, host },
        `gRPC call: ${definition.name}.${methodName}`,
      );

      try {
        // In production, this would use the actual grpc-js client.
        // This stub validates the pattern works.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const grpc = require("@grpc/grpc-js") as typeof import("@grpc/grpc-js");
        const credentials = tls
          ? grpc.credentials.createSsl()
          : grpc.credentials.createInsecure();

        // Real implementation would use proto-loaded service definition.
        // For now, throw a descriptive error.
        throw new Error(
          `gRPC client stub: ${definition.name}.${methodName} — ` +
          `load your .proto file and use proto-loader for real RPC calls. ` +
          `See: https://github.com/grpc/grpc-node/tree/master/packages/proto-loader`,
        );
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("gRPC client stub:")) {
          throw err;
        }
        throw new Error(
          `gRPC not available: install @grpc/grpc-js and @grpc/proto-loader`,
        );
      }
    };
  }

  return client;
}

// ─── Proto File Location Convention ──────────────────────────────────────────

/**
 * Suggested proto file layout for multi-product monorepos:
 *
 *   packages/grpc/
 *   ├── proto/
 *   │   ├── user/v1/user.proto
 *   │   ├── billing/v1/billing.proto
 *   │   └── common/v1/types.proto
 *   ├── generated/           (auto-generated TypeScript types)
 *   │   ├── user/v1/
 *   │   └── billing/v1/
 *   └── src/
 *       └── index.ts         (this file)
 *
 * Generate types with:
 *   npx proto-loader-gen-types --grpcLib=@grpc/grpc-js --outDir=generated proto/**\/*.proto
 */
export const PROTO_DIR = "proto";
export const GENERATED_DIR = "generated";
