import { NextResponse } from "next/server";
import { readJson, withErrors } from "@/lib/api-errors";
import { isMissingTable } from "@/lib/prisma-errors";
import { LESSONS_NOT_READY, readLessonDoneBody } from "@/lib/ucat-lessons";
import { setLessonDone } from "@/lib/ucat-service";

/** Mark a lesson done, or not done again. */
async function POSTHandler(request: Request) {
  const result = readLessonDoneBody(await readJson(request));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    await setLessonDone(result.lessonId, result.done);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTable(e)) return NextResponse.json({ error: LESSONS_NOT_READY }, { status: 503 });
    throw e;
  }
}

export const POST = withErrors(POSTHandler);
