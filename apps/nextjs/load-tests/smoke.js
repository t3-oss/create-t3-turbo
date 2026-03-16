/**
 * k6 Load Test — Smoke Test
 *
 * Quick sanity check that the app handles a small amount of traffic.
 * Run: k6 run apps/nextjs/load-tests/smoke.js
 *
 * Install k6: https://k6.io/docs/get-started/installation/
 *
 * Environment variables:
 *   BASE_URL — Target URL (default: http://localhost:3000)
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  // Smoke test: 1-5 virtual users for 30 seconds
  vus: 3,
  duration: "30s",
  thresholds: {
    // 95% of requests should complete under 500ms
    http_req_duration: ["p(95)<500"],
    // Less than 1% failure rate
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    "health check returns 200": (r) => r.status === 200,
    "health check is healthy": (r) => {
      try {
        return JSON.parse(r.body).status === "healthy";
      } catch {
        return false;
      }
    },
  });

  // Home page
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    "home page returns 200": (r) => r.status === 200,
    "home page loads fast": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
