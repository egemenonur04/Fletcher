import { db } from "@/lib/db";
import type { HierarchyOption } from "@/components/ui/HierarchySelect";

// Type-only import — erased at compile time, so this server module never drags the
// client component across the bundle boundary (nor `pg` the other way).

/**
 * Standalone entries sort first. Postgres puts NULLs last on an ascending sort and Prisma's
 * `nulls` option does not apply to a relation `orderBy`, so unparented rows sank to the
 * bottom of every picker — exactly the ones worth offering when filing something.
 */
const standaloneFirst = (a: HierarchyOption, b: HierarchyOption) =>
  Number(a.parentName !== null) - Number(b.parentName !== null) ||
  (a.parentName ?? "").localeCompare(b.parentName ?? "") ||
  a.name.localeCompare(b.name);

// Nothing sits above a universe, so both parent fields are always null.
const shapeRoot = (rows: { id: string; name: string }[]): HierarchyOption[] =>
  rows.map((r) => ({ ...r, parentName: null, parentId: null }));

const ROOT = { id: true, name: true } as const;
const ROOT_ORDER = { name: "asc" as const };

/* ── Universes, for picking a film's parent ─────────────────────────────── */

export async function movieUniverseOptions(): Promise<HierarchyOption[]> {
  return shapeRoot(await db.movieUniverse.findMany({ select: ROOT, orderBy: ROOT_ORDER }));
}

/* ── Films, for attaching an existing one to a universe ──────────────────── */

// Movies have no series tier — a film hangs directly off a universe.
export async function movieTitleOptions(): Promise<HierarchyOption[]> {
  const rows = await db.movie.findMany({
    select: { id: true, title: true, universe: { select: { id: true, name: true } } },
    orderBy: [{ universe: { name: "asc" } }, { title: "asc" }],
  });
  return rows
    .map((r) => ({
      id: r.id,
      name: r.title,
      parentName: r.universe?.name ?? null,
      parentId: r.universe?.id ?? null,
    }))
    .sort(standaloneFirst);
}
