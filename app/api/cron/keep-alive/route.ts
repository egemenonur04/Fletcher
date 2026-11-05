import { NextRequest } from "next/server";
import { withErrors } from "@/lib/api-errors";
import { db } from "@/lib/db";
import { keepAlive } from "@/lib/keep-alive";

// Never cached: every call has to reach the database, or the project still looks idle.
export const dynamic = "force-dynamic";

/**
 * Called once a day by Vercel Cron (vercel.json) with `Authorization: Bearer <CRON_SECRET>`, so
 * the free-plan Supabase project is never paused for inactivity. No session needed: the proxy
 * lets this exact path through and the bearer check here guards it.
 */
async function GETHandler(request: NextRequest) {
  return keepAlive(request.headers.get("authorization"), process.env.CRON_SECRET, () => db.$queryRaw`SELECT 1`);
}

export const GET = withErrors(GETHandler);
