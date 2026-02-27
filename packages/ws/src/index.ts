/**
 * @gmacko/ws — WebSocket Server & Client Utilities
 *
 * Provides a typed WebSocket server with room/channel support, authentication,
 * and presence tracking. Works standalone or alongside Next.js.
 *
 * Supports two modes:
 * - **Managed (Pusher/Ably):** Use @gmacko/realtime for hosted pub/sub
 * - **Self-hosted (this package):** Run your own WS server for custom
 *   protocols, collaborative features, cursor presence, etc.
 *
 * Usage:
 *   import { createWSServer, createWSClient } from "@gmacko/ws";
 *
 *   // Server
 *   const wss = createWSServer({ port: 3001 });
 *   wss.onConnection((socket, context) => {
 *     socket.join("room:123");
 *     socket.on("cursor:move", (data) => {
 *       socket.to("room:123").emit("cursor:move", { ...data, userId: context.userId });
 *     });
 *   });
 */

import { createLogger } from "@gmacko/logging";

const logger = createLogger({ component: "ws" });

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WSServerConfig {
  /** Port to listen on (default: 3001) */
  port?: number;
  /** Path prefix (default: "/ws") */
  path?: string;
  /** Authentication handler — return user context or null to reject */
  authenticate?: (
    token: string,
  ) => Promise<WSContext | null>;
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number;
  /** Max payload size in bytes (default: 1MB) */
  maxPayloadSize?: number;
}

export interface WSContext {
  userId: string;
  sessionId?: string;
  organizationId?: string;
  [key: string]: unknown;
}

export interface WSSocket {
  id: string;
  context: WSContext | null;
  rooms: Set<string>;
  send(event: string, data: unknown): void;
  join(room: string): void;
  leave(room: string): void;
  to(room: string): { emit(event: string, data: unknown): void };
  broadcast(event: string, data: unknown): void;
  on(event: string, handler: (data: unknown) => void): void;
  off(event: string, handler?: (data: unknown) => void): void;
  disconnect(code?: number, reason?: string): void;
}

export type ConnectionHandler = (
  socket: WSSocket,
  context: WSContext | null,
) => void;

export type DisconnectHandler = (
  socket: WSSocket,
  code: number,
  reason: string,
) => void;

export interface WSServer {
  onConnection(handler: ConnectionHandler): void;
  onDisconnect(handler: DisconnectHandler): void;
  /** Emit to all sockets in a room */
  to(room: string): { emit(event: string, data: unknown): void };
  /** Emit to all connected sockets */
  broadcast(event: string, data: unknown): void;
  /** Get all sockets in a room */
  getRoom(room: string): WSSocket[];
  /** Get connected socket count */
  getConnectionCount(): number;
  /** Gracefully shut down */
  close(): Promise<void>;
}

// ─── In-Memory Implementation ────────────────────────────────────────────────

interface InternalSocket {
  id: string;
  context: WSContext | null;
  rooms: Set<string>;
  handlers: Map<string, Set<(data: unknown) => void>>;
  rawSend?: (data: string) => void;
}

const sockets = new Map<string, InternalSocket>();
const rooms = new Map<string, Set<string>>(); // room -> socket IDs

function generateSocketId(): string {
  return `ws_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function createSocketAPI(internal: InternalSocket): WSSocket {
  return {
    get id() {
      return internal.id;
    },
    get context() {
      return internal.context;
    },
    get rooms() {
      return internal.rooms;
    },

    send(event: string, data: unknown) {
      internal.rawSend?.(JSON.stringify({ event, data }));
    },

    join(room: string) {
      internal.rooms.add(room);
      if (!rooms.has(room)) rooms.set(room, new Set());
      rooms.get(room)!.add(internal.id);
      logger.debug({ socketId: internal.id, room }, "Socket joined room");
    },

    leave(room: string) {
      internal.rooms.delete(room);
      rooms.get(room)?.delete(internal.id);
      if (rooms.get(room)?.size === 0) rooms.delete(room);
    },

    to(room: string) {
      return {
        emit(event: string, data: unknown) {
          const socketIds = rooms.get(room);
          if (!socketIds) return;
          const message = JSON.stringify({ event, data });
          for (const id of socketIds) {
            if (id !== internal.id) {
              sockets.get(id)?.rawSend?.(message);
            }
          }
        },
      };
    },

    broadcast(event: string, data: unknown) {
      const message = JSON.stringify({ event, data });
      for (const [id, sock] of sockets) {
        if (id !== internal.id) {
          sock.rawSend?.(message);
        }
      }
    },

    on(event: string, handler: (data: unknown) => void) {
      if (!internal.handlers.has(event)) {
        internal.handlers.set(event, new Set());
      }
      internal.handlers.get(event)!.add(handler);
    },

    off(event: string, handler?: (data: unknown) => void) {
      if (handler) {
        internal.handlers.get(event)?.delete(handler);
      } else {
        internal.handlers.delete(event);
      }
    },

    disconnect(_code?: number, _reason?: string) {
      // Clean up rooms
      for (const room of internal.rooms) {
        rooms.get(room)?.delete(internal.id);
        if (rooms.get(room)?.size === 0) rooms.delete(room);
      }
      sockets.delete(internal.id);
    },
  };
}

// ─── Server Factory ──────────────────────────────────────────────────────────

/**
 * Create a WebSocket server.
 *
 * In production, this wraps the `ws` npm package. The factory pattern
 * allows swapping the underlying transport (e.g., uWebSockets.js for
 * higher performance).
 *
 * If `ws` is not installed, returns a stub server that logs a warning.
 */
export function createWSServer(config: WSServerConfig = {}): WSServer {
  const {
    port = 3001,
    path = "/ws",
    authenticate,
    heartbeatInterval = 30_000,
    maxPayloadSize = 1_048_576,
  } = config;

  let connectionHandlers: ConnectionHandler[] = [];
  let disconnectHandlers: DisconnectHandler[] = [];
  let wssInstance: unknown = null;

  // Try to start a real WS server
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebSocketServer } = require("ws") as typeof import("ws");
    const wss = new WebSocketServer({ port, path, maxPayload: maxPayloadSize });
    wssInstance = wss;

    wss.on("connection", async (ws, req) => {
      const socketId = generateSocketId();
      const internal: InternalSocket = {
        id: socketId,
        context: null,
        rooms: new Set(),
        handlers: new Map(),
        rawSend: (data: string) => {
          if (ws.readyState === ws.OPEN) ws.send(data);
        },
      };

      // Authenticate if handler provided
      if (authenticate) {
        const url = new URL(req.url ?? "/", `http://localhost:${port}`);
        const token = url.searchParams.get("token") ?? "";
        const ctx = await authenticate(token);
        if (!ctx) {
          ws.close(4001, "Unauthorized");
          return;
        }
        internal.context = ctx;
      }

      sockets.set(socketId, internal);
      const socketApi = createSocketAPI(internal);

      logger.info(
        { socketId, userId: internal.context?.userId },
        "WebSocket connected",
      );

      for (const handler of connectionHandlers) {
        handler(socketApi, internal.context);
      }

      ws.on("message", (raw) => {
        try {
          const { event, data } = JSON.parse(raw.toString()) as {
            event: string;
            data: unknown;
          };
          const handlers = internal.handlers.get(event);
          if (handlers) {
            for (const handler of handlers) handler(data);
          }
        } catch {
          logger.warn({ socketId }, "Invalid WS message format");
        }
      });

      ws.on("close", (code, reason) => {
        const reasonStr = reason?.toString() ?? "";
        socketApi.disconnect(code, reasonStr);
        for (const handler of disconnectHandlers) {
          handler(socketApi, code, reasonStr);
        }
        logger.info({ socketId, code }, "WebSocket disconnected");
      });

      // Heartbeat
      const interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) ws.ping();
      }, heartbeatInterval);
      ws.on("close", () => clearInterval(interval));
    });

    logger.info({ port, path }, "WebSocket server started");
  } catch {
    logger.warn(
      "ws package not installed — WebSocket server running in stub mode. Install ws: pnpm add ws",
    );
  }

  return {
    onConnection(handler) {
      connectionHandlers.push(handler);
    },

    onDisconnect(handler) {
      disconnectHandlers.push(handler);
    },

    to(room: string) {
      return {
        emit(event: string, data: unknown) {
          const socketIds = rooms.get(room);
          if (!socketIds) return;
          const message = JSON.stringify({ event, data });
          for (const id of socketIds) {
            sockets.get(id)?.rawSend?.(message);
          }
        },
      };
    },

    broadcast(event: string, data: unknown) {
      const message = JSON.stringify({ event, data });
      for (const sock of sockets.values()) {
        sock.rawSend?.(message);
      }
    },

    getRoom(room: string) {
      const ids = rooms.get(room);
      if (!ids) return [];
      return Array.from(ids)
        .map((id) => sockets.get(id))
        .filter(Boolean)
        .map((s) => createSocketAPI(s!));
    },

    getConnectionCount() {
      return sockets.size;
    },

    async close() {
      connectionHandlers = [];
      disconnectHandlers = [];
      for (const sock of sockets.values()) {
        sock.rawSend?.(JSON.stringify({ event: "server:shutdown", data: {} }));
      }
      sockets.clear();
      rooms.clear();
      if (wssInstance && typeof (wssInstance as { close: () => void }).close === "function") {
        (wssInstance as { close: () => void }).close();
      }
      logger.info("WebSocket server closed");
    },
  };
}

// ─── Client Helper ───────────────────────────────────────────────────────────

export interface WSClientConfig {
  url: string;
  token?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * Create a WebSocket client (for use in Node.js scripts, tests, or workers).
 * For browser clients, use the native WebSocket API directly.
 */
export function createWSClient(config: WSClientConfig) {
  const {
    url,
    token,
    reconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
  } = config;

  const fullUrl = token ? `${url}?token=${encodeURIComponent(token)}` : url;

  return {
    url: fullUrl,
    reconnect,
    reconnectInterval,
    maxReconnectAttempts,

    /** Connect and return a raw WebSocket (Node.js ws or browser WebSocket) */
    connect() {
      if (typeof globalThis.WebSocket !== "undefined") {
        return new globalThis.WebSocket(fullUrl);
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { WebSocket } = require("ws") as typeof import("ws");
      return new WebSocket(fullUrl);
    },
  };
}
