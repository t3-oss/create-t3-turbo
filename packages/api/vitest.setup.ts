import { MongoClient } from "mongodb";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, vi } from "vitest";

let mongod: MongoMemoryReplSet | undefined;

// Increase timeouts for MongoDB operations
vi.setConfig({
  testTimeout: 30000,
  hookTimeout: 30000,
});

// Helper function to wait for replica set to be ready
async function waitForReplicaSet(uri: string, maxAttempts = 5) {
  const client = new MongoClient(uri);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `Attempting to connect to MongoDB (attempt ${attempt}/${maxAttempts})...`,
      );
      await client.connect();

      // Check replica set status
      const status = await client.db("admin").command({ replSetGetStatus: 1 });
      if (status.ok === 1) {
        console.log("Replica set is ready");
        return true;
      }
    } catch {
      console.log(`Attempt ${attempt} failed, waiting 2 seconds...`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      try {
        await client.close();
      } catch {
        // Ignore close errors
      }
    }
  }
  throw new Error("Failed to connect to MongoDB replica set");
}

beforeAll(async () => {
  console.log("Starting MongoDB Memory Server...");
  mongod = await MongoMemoryReplSet.create({
    replSet: { count: 1 }, // Reduced to 1 node for faster startup
  });

  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  // Wait for replica set to be ready with retries
  await waitForReplicaSet(uri);

  // Configure Mongoose
  mongoose.set("bufferCommands", false); // Disable buffering
  await mongoose.connect(uri);
  console.log("Mongoose connected successfully");
});

afterAll(async () => {
  if (
    mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected
  ) {
    await mongoose.disconnect();
    console.log("Mongoose disconnected");
  }
  if (mongod) {
    await mongod.stop();
    console.log("MongoDB Memory Server stopped");
  }
});

// Mock next-auth
vi.mock("next-auth", () => {
  return {
    default: () => ({
      handlers: {
        GET: vi.fn(),
        POST: vi.fn(),
      },
      auth: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    }),
  };
});

// Mock @acme/auth
vi.mock("@acme/auth", () => {
  return {
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    handlers: {
      GET: vi.fn(),
      POST: vi.fn(),
    },
    invalidateSessionToken: vi.fn(),
    validateToken: vi.fn(),
    isSecureContext: vi.fn(),
  };
});

// Mock next/server
vi.mock("next/server", () => ({
  NextResponse: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    json: vi.fn((data) => data),
  },
}));
