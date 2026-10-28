import { NextResponse } from "next/server";
import { withErrors } from "@/lib/api-errors";
import { isMissingTable } from "@/lib/prisma-errors";
import { UCAT_NOT_READY } from "@/lib/ucat";
import { deleteUcatScore } from "@/lib/ucat-service";

type RouteContext = { params: Promise<{ id: string }> };

async function DELETEHandler(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  try {
    const removed = await deleteUcatScore(id);
    if (!removed) return NextResponse.json({ error: "Score not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isMissingTable(e)) return NextResponse.json({ error: UCAT_NOT_READY }, { status: 503 });
    throw e;
  }
}

export const DELETE = withErrors(DELETEHandler);
