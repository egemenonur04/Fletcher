import { NextResponse } from "next/server";
import { withErrors } from "@/lib/api-errors";
import { HEALTH_NOT_READY } from "@/lib/health";
import { isMissingTable } from "@/lib/prisma-errors";
import { StravaError, syncStrava } from "@/lib/strava";

/** Import new Strava activities. */
async function POSTHandler() {
  try {
    return NextResponse.json(await syncStrava());
  } catch (e) {
    if (e instanceof StravaError) return NextResponse.json({ error: e.message }, { status: 502 });
    if (isMissingTable(e)) return NextResponse.json({ error: HEALTH_NOT_READY }, { status: 503 });
    throw e;
  }
}

export const POST = withErrors(POSTHandler);
