import { NextResponse } from "next/server";
import { withErrors } from "@/lib/api-errors";
import { isDateKey } from "@/lib/dates";
import { HEALTH_NOT_READY } from "@/lib/health";
import { deleteWeight } from "@/lib/health-service";
import { isMissingTable } from "@/lib/prisma-errors";

type RouteContext = { params: Promise<{ date: string }> };

async function DELETEHandler(_request: Request, { params }: RouteContext) {
  const { date } = await params;
  if (!isDateKey(date)) return NextResponse.json({ error: "Not a date" }, { status: 400 });
  try {
    await deleteWeight(date);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTable(e)) return NextResponse.json({ error: HEALTH_NOT_READY }, { status: 503 });
    throw e;
  }
}

export const DELETE = withErrors(DELETEHandler);
