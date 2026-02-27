/**
 * k6 Load Test — Stress Test
 *
 * Tests the app under increasing load to find breaking points.
 * Run: k6 run apps/nextjs/load-tests/stress.js
 *
 * Stages:
 *   1. Ramp up to 50 users over 2 minutes
 *   2. Stay at 50 users for 3 minutes
 *   3. Ramp up to 100 users over 2 minutes
 *   4. Stay at 100 users for 3 minutes
 *   5. Ramp down to 0 over 2 minutes
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "3m", target: 50 },
    { duration: "2m", target: 100 },
    { duration: "3m", target: 100 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000", "p(99)<5000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  const responses = http.batch([
    ["GET", `${BASE_URL}/api/health`],
    ["GET", `${BASE_URL}/`],
    ["GET", `${BASE_URL}/privacy`],
  ]);

  for (const res of responses) {
    check(res, {
      "status is 200": (r) => r.status === 200,
    });
  }

  sleep(Math.random() * 3 + 1);
}
