import { db } from "@gmacko/db/client";
import { NextResponse } from "next/server";

interface ForgeHealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs: number;
  checkedAt: string;
  error?: string;
}

interface ForgeHealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: "1.0";
  timestamp: string;
  checks: Record<string, ForgeHealthCheck>;
}

async function checkPostgres(): Promise<ForgeHealthCheck> {
  const start = Date.now();
  try {
    await db.execute("SELECT 1");
    const latencyMs = Date.now() - start;
    return {
      status: latencyMs > 2000 ? "degraded" : "healthy",
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      checkedAt: new Date().toISOString(),
      error:
        process.env.NODE_ENV === "production"
          ? "connection failed"
          : error instanceof Error
            ? error.message
            : "connection failed",
    };
  }
}

function deriveOverallStatus(
  checks: Record<string, ForgeHealthCheck>,
): ForgeHealthResponse["status"] {
  const statuses = Object.values(checks).map((c) => c.status);
  if (statuses.includes("unhealthy")) return "unhealthy";
  if (statuses.includes("degraded")) return "degraded";
  return "healthy";
}

export async function GET() {
  const postgres = await checkPostgres();
  const checks = { postgres };
  const status = deriveOverallStatus(checks);

  const body: ForgeHealthResponse = {
    status,
    version: "1.0",
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(body, {
    status: status === "unhealthy" ? 503 : 200,
  });
}
