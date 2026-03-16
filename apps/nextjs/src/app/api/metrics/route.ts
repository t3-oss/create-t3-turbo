import { NextResponse } from "next/server";

import { getMetricsHandler } from "@gmacko/metrics";

/**
 * GET /api/metrics — Prometheus-compatible metrics endpoint.
 *
 * Returns application metrics in Prometheus text exposition format.
 * Typically scraped by Prometheus, Grafana Agent, or Datadog Agent.
 *
 * Security: In production, protect this endpoint via network rules or
 * add a bearer token check (e.g., METRICS_SECRET env var).
 */
const handler = getMetricsHandler();

export async function GET(request: Request) {
  // Optional: restrict to internal network / require auth token
  const authHeader = request.headers.get("authorization");
  const metricsSecret = process.env.METRICS_SECRET;

  if (metricsSecret && authHeader !== `Bearer ${metricsSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return handler();
}
