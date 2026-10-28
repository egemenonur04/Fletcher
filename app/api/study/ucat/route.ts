import { NextResponse } from "next/server";
import { readJson, withErrors } from "@/lib/api-errors";
import { isMissingTable } from "@/lib/prisma-errors";
import { UCAT_NOT_READY, readScoreBody } from "@/lib/ucat";
import { createUcatScore } from "@/lib/ucat-service";

/** Log a practice-test result. */
async function POSTHandler(request: Request) {
  const result = readScoreBody(await readJson(request));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    return NextResponse.json(await createUcatScore(result.body), { status: 201 });
  } catch (e) {
    if (isMissingTable(e)) return NextResponse.json({ error: UCAT_NOT_READY }, { status: 503 });
    throw e;
  }
}

export const POST = withErrors(POSTHandler);
