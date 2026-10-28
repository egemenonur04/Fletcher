import { NextRequest, NextResponse } from "next/server";
import { readJson, withErrors } from "@/lib/api-errors";
import { isMissingTable } from "@/lib/prisma-errors";
import { readAttempts } from "@/lib/sat-attempt-schema";
import { ATTEMPTS_MISSING, recordAttempts } from "@/lib/sat-attempt-service";

/** A finished practice set's answers, marked and saved. */
async function POSTHandler(request: NextRequest) {
  const parsed = readAttempts(await readJson(request));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  try {
    const saved = await recordAttempts(parsed.attempts);
    return NextResponse.json({ saved }, { status: 201 });
  } catch (error) {
    if (isMissingTable(error)) return NextResponse.json({ error: ATTEMPTS_MISSING }, { status: 503 });
    throw error;
  }
}

export const POST = withErrors(POSTHandler);
