// Talking to MyAnimeList's official API (v2). Server-only: it reads MAL_CLIENT_ID, which must
// never reach a browser — the API license forbids sharing it. Pure rules live in lib/mal-manga.ts.
//
// Only documented endpoints: /manga?q= (search), /manga/{id} and a user's public manga list.
// Public data needs only the Client ID, sent as X-MAL-CLIENT-ID — no user login.

import { toManga, type MalManga } from "@/lib/mal-manga";
import type { ListedManga } from "@/lib/mal-manga-list";

/** Overridable so the importer can be tested against a local stand-in; production never sets it. */
const BASE_URL = (process.env.MAL_BASE_URL ?? "https://api.myanimelist.net/v2").replace(/\/$/, "");

const MANGA_FIELDS =
  "id,title,main_picture,alternative_titles,start_date,media_type,status,num_volumes,num_chapters,authors{first_name,last_name}";

export class MalError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function clientId(): string {
  const id = process.env.MAL_CLIENT_ID?.trim();
  if (!id) throw new MalError("MyAnimeList isn't set up — add MAL_CLIENT_ID to the site's environment.", 503);
  return id;
}

type Raw = Record<string, unknown>;

async function get(path: string, params: Record<string, string>, refused?: string): Promise<Raw> {
  const id = clientId();
  const url = new URL(`${BASE_URL}${path}`);
  url.search = new URLSearchParams(params).toString();

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "X-MAL-CLIENT-ID": id, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
  } catch {
    throw new MalError("Couldn't reach MyAnimeList — try again in a minute.", 502);
  }

  if (res.status === 401 || res.status === 403) {
    throw new MalError(refused ?? "MyAnimeList refused the Client ID — check MAL_CLIENT_ID.", 502);
  }
  if (res.status === 404) throw new MalError("That isn't on MyAnimeList.", 404);
  if (res.status === 429) throw new MalError("MyAnimeList is rate-limiting requests — wait a moment and try again.", 429);
  const body = (await res.json().catch(() => null)) as Raw | null;
  if (res.status === 400) {
    throw new MalError(`MyAnimeList didn't accept that search${body?.message ? `: ${String(body.message)}` : "."}`, 400);
  }
  if (!res.ok || !body) throw new MalError(`MyAnimeList answered ${res.status}.`, 502);
  return body;
}

/** Manga matching a search, in MyAnimeList's relevance order. MAL wants at least 3 letters. */
export async function searchManga(query: string): Promise<MalManga[]> {
  const body = await get("/manga", { q: query, limit: "15", fields: MANGA_FIELDS });
  const rows = Array.isArray(body.data) ? (body.data as Raw[]) : [];
  return rows.map((row) => toManga(row?.node as Raw | undefined)).filter((m): m is MalManga => m !== null);
}

/** One manga — the whole series, volumes and chapters counted inside it. */
export async function mangaEntry(id: number): Promise<MalManga> {
  const found = toManga(await get(`/manga/${id}`, { fields: MANGA_FIELDS }));
  if (!found) throw new MalError("MyAnimeList sent that manga without a title.", 502);
  return found;
}

/**
 * Everything on a user's public manga list, with your status and how far you are on each, a
 * thousand at a time. Only the Client ID is sent — MyAnimeList may answer that a list needs its
 * owner signed in, or is private; then the list file is the way in.
 */
export async function userMangaList(user: string): Promise<ListedManga[]> {
  const out: ListedManga[] = [];
  for (let offset = 0; offset < 20_000; offset += 1000) {
    const body = await get(
      `/users/${encodeURIComponent(user)}/mangalist`,
      { limit: "1000", offset: String(offset), fields: `${MANGA_FIELDS},list_status`, nsfw: "true" },
      "MyAnimeList wouldn't share that list with the site — it may be private, or need you signed in. Upload your list file instead.",
    );
    const rows = Array.isArray(body.data) ? (body.data as Raw[]) : [];
    for (const row of rows) {
      const manga = toManga(row?.node as Raw | undefined);
      const status = (row?.list_status ?? {}) as Raw;
      const count = (v: unknown) => (Number.isInteger(Number(v)) && Number(v) > 0 ? Number(v) : null);
      if (manga) out.push({
        manga,
        status: typeof status.status === "string" ? status.status : null,
        chaptersRead: count(status.num_chapters_read),
        volumesRead: count(status.num_volumes_read),
      });
    }
    if (rows.length < 1000) break;
  }
  return out;
}
