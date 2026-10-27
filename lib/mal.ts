// MyAnimeList's image CDN: the one host a MAL cover may come from. Pure and dependency-free.
//
// Only the official MyAnimeList API (v2) is used (lib/mal-service.ts). The API license allows
// personal, non-commercial use, asks that MyAnimeList be credited as the source, and forbids
// altering its content: titles are stored exactly as MyAnimeList gives them.

export const MAL_IMAGE_HOST = "cdn.myanimelist.net";

/** A MAL image URL, checked: https, on MAL's own CDN. Anything else is refused. */
export function malImage(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === MAL_IMAGE_HOST ? u.href : null;
  } catch {
    return null;
  }
}

/** Covers are shown straight from MAL's CDN — see app/api/manga/mirror-covers. */
export function isMalImage(src: string | null | undefined): boolean {
  if (!src) return false;
  try {
    return new URL(src).hostname === MAL_IMAGE_HOST;
  } catch {
    return false;
  }
}
