import { NextResponse } from "next/server";

import { processJobs, getQueueStatus } from "@gmacko/jobs";

/**
 * Cron endpoint to process background jobs.
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/jobs",
 *     "schedule": "* * * * *"
 *   }]
 * }
 *
 * Or call via external cron service (e.g., cron-job.org, EasyCron).
 * Protect with CRON_SECRET in production.
 */
export async function GET(req: Request) {
  // Verify cron secret in production
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await processJobs({ batchSize: 25 });
  const status = getQueueStatus();

  return NextResponse.json({
    ...result,
    queue: status,
    timestamp: new Date().toISOString(),
  });
}
