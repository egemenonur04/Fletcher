import { NextResponse } from "next/server";
import { withErrors } from "@/lib/api-errors";
import { disconnect } from "@/lib/strava";

/** Forget the Strava connection. Imported workouts stay. */
async function POSTHandler() {
  await disconnect();
  return NextResponse.json({ ok: true });
}

export const POST = withErrors(POSTHandler);
