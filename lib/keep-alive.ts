// The daily keep-alive. Supabase's free plan pauses a project after about a week with no
// database activity, which took the whole site down on 2026-11-05. Vercel Cron calls this once a
// day; one trivial query is enough to count as activity.
//
// Pure: the query is passed in, so the rules here are tested without a database.

import { verifyReportToken } from "@/lib/session";

/** The one path Vercel Cron calls. The proxy lets it through without a session (see proxy.ts). */
export const KEEP_ALIVE_PATH = "/api/cron/keep-alive";

/**
 * Checks `Authorization: Bearer <CRON_SECRET>` — the header Vercel Cron sends — then runs `ping`.
 *
 * The same fail-closed comparison as REPORT_TOKEN's: an unset, blank or under-32-character
 * CRON_SECRET matches nothing, so a missing variable can never open the endpoint. A database
 * failure is a 503, so the cron run shows as failed in Vercel.
 */
export async function keepAlive(
  authorization: string | null,
  secret: string | undefined,
  ping: () => Promise<unknown>,
): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  if (!(await verifyReportToken(authorization, secret))) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  try {
    await ping();
  } catch (e) {
    // Detail stays in the logs; the response says only that the database did not answer.
    console.error("[keep-alive]", e);
    return Response.json({ ok: false, error: "Database unreachable" }, { status: 503, headers });
  }
  return Response.json({ ok: true, at: new Date().toISOString() }, { headers });
}
