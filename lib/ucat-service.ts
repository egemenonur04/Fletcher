import { db } from "@/lib/db";
import { isMissingTable, isNotFound } from "@/lib/prisma-errors";
import type { UcatScore, UcatScoreBody } from "@/lib/ucat";

type Row = Omit<UcatScore, "takenOn"> & { takenOn: Date };

const toScore = (row: Row): UcatScore => ({ ...row, takenOn: row.takenOn.toISOString().slice(0, 10) });

/** Every practice result, newest first. Null until migration 044 has run. */
export async function listUcatScores(): Promise<UcatScore[] | null> {
  try {
    const rows = await db.ucatScore.findMany({
      orderBy: [{ takenOn: "desc" }, { createdAt: "desc" }],
      select: { id: true, takenOn: true, source: true, vr: true, dm: true, qr: true, sjt: true, notes: true },
    });
    return rows.map(toScore);
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}

export async function createUcatScore(body: UcatScoreBody): Promise<UcatScore> {
  const row = await db.ucatScore.create({
    data: { ...body, takenOn: new Date(`${body.takenOn}T00:00:00Z`) },
    select: { id: true, takenOn: true, source: true, vr: true, dm: true, qr: true, sjt: true, notes: true },
  });
  return toScore(row);
}

/** False when it was already deleted. */
export async function deleteUcatScore(id: string): Promise<boolean> {
  try {
    await db.ucatScore.delete({ where: { id } });
    return true;
  } catch (e) {
    if (isNotFound(e)) return false;
    throw e;
  }
}

/** The ids of the finished lessons. Null until migration 046 has run. */
export async function listDoneLessons(): Promise<string[] | null> {
  try {
    const rows = await db.ucatLessonDone.findMany({ select: { lessonId: true } });
    return rows.map((r) => r.lessonId);
  } catch (e) {
    if (isMissingTable(e)) return null;
    throw e;
  }
}

export async function setLessonDone(lessonId: string, done: boolean): Promise<void> {
  if (done) await db.ucatLessonDone.upsert({ where: { lessonId }, create: { lessonId }, update: {} });
  else await db.ucatLessonDone.deleteMany({ where: { lessonId } });
}
