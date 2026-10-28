import { NextResponse } from "next/server";
import { readJson, withErrors } from "@/lib/api-errors";
import { HEALTH_NOT_READY, readWorkoutBody } from "@/lib/health";
import { createWorkout } from "@/lib/health-service";
import { isMissingTable } from "@/lib/prisma-errors";

/** Log a workout, with its exercises. */
async function POSTHandler(request: Request) {
  const result = readWorkoutBody(await readJson(request));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    return NextResponse.json(await createWorkout(result.body), { status: 201 });
  } catch (e) {
    if (isMissingTable(e)) return NextResponse.json({ error: HEALTH_NOT_READY }, { status: 503 });
    throw e;
  }
}

export const POST = withErrors(POSTHandler);
