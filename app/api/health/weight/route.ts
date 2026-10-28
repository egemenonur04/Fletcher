import { NextResponse } from "next/server";
import { readJson, withErrors } from "@/lib/api-errors";
import { HEALTH_NOT_READY, readWeightBody } from "@/lib/health";
import { saveWeight } from "@/lib/health-service";
import { isMissingTable } from "@/lib/prisma-errors";

/** Record a weigh-in; a second one on the same day replaces the first. */
async function POSTHandler(request: Request) {
  const result = readWeightBody(await readJson(request));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    return NextResponse.json(await saveWeight(result.body));
  } catch (e) {
    if (isMissingTable(e)) return NextResponse.json({ error: HEALTH_NOT_READY }, { status: 503 });
    throw e;
  }
}

export const POST = withErrors(POSTHandler);
