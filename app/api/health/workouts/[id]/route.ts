import { NextResponse } from "next/server";
import { withErrors } from "@/lib/api-errors";
import { HEALTH_NOT_READY } from "@/lib/health";
import { deleteWorkout } from "@/lib/health-service";
import { isMissingTable } from "@/lib/prisma-errors";

type RouteContext = { params: Promise<{ id: string }> };

async function DELETEHandler(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    if (!(await deleteWorkout(id))) return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTable(e)) return NextResponse.json({ error: HEALTH_NOT_READY }, { status: 503 });
    throw e;
  }
}

export const DELETE = withErrors(DELETEHandler);
