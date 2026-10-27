import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { calculateMangaTime, calculateComicTime, calculateArticleTime } from "@/lib/reading-time";
import type { LanguageKey } from "@/lib/constants/languages";
import DashboardClient from "@/components/dashboard/DashboardClient";

function c(groups: { status: string; _count: { _all: number } }[], status: string) {
  return groups.find((g) => g.status === status)?._count._all ?? 0;
}

function total(groups: { status: string; _count: { _all: number } }[]) {
  return groups.reduce((s, g) => s + g._count._all, 0);
}

const getDashboardData = unstable_cache(
  async () => {
    const [movies, games, manga, articles] = await Promise.all([
      db.movie.groupBy({ by: ["status"], _count: { _all: true } }),
      db.game.groupBy({ by: ["status"], _count: { _all: true } }),
      db.manga.groupBy({ by: ["status"], _count: { _all: true } }),
      db.article.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    // Comics no longer have a status enum — the hierarchy reports scalar counts instead.
    const [comicTitleCount, comicIssueCount, comicReadAgg] = await Promise.all([
      db.comicTitle.count(),
      db.comicIssue.count(),
      db.comicIssue.aggregate({
        where: { read: true },
        _count: { _all: true },
        _sum: { timesReread: true },
      }),
    ]);
    const comicReadCount = comicReadAgg._count._all;
    // One time unit per pass through an issue: the first read plus every reread.
    const comicReadUnits = comicReadCount + (comicReadAgg._sum.timesReread ?? 0);

    const [watchedMovies, gamesAgg, mangaTime, articlesTime] = await Promise.all([
      db.movie.findMany({ where: { status: "WATCHED" }, select: { runtime: true, timesRewatched: true } }),
      db.game.aggregate({ _sum: { hoursPlayed: true } }),
      db.manga.findMany({ select: { chaptersRead: true, language: true, timesReread: true } }),
      db.article.findMany({ where: { status: "READ" }, select: { wordCount: true, language: true, timesReread: true } }),
    ]);

    const moviesMinutes   = watchedMovies.reduce((s, m) => s + m.runtime * (m.timesRewatched + 1), 0);
    const gamesMinutes    = Math.round((gamesAgg._sum.hoursPlayed ?? 0) * 60);
    const mangaMinutes    = mangaTime.reduce((s, m) => s + calculateMangaTime(m.chaptersRead, m.language as LanguageKey).minutes * (m.timesReread + 1), 0);
    const comicsMinutes   = calculateComicTime(comicReadUnits, "ENGLISH").minutes;
    const articlesMinutes = articlesTime.reduce((s, a) => s + calculateArticleTime(a.wordCount, a.language as LanguageKey).minutes * (a.timesReread + 1), 0);

    const totalMinutes = moviesMinutes + gamesMinutes + mangaMinutes + comicsMinutes + articlesMinutes;

    const sections = [
      {
        key: "movies", href: "/library/movies", label: "Movies", minutes: moviesMinutes,
        stats: [{ label: "Total", value: total(movies) }, { label: "Watched", value: c(movies, "WATCHED") }, { label: "Remaining", value: c(movies, "WANT_TO_WATCH") }],
      },
      {
        key: "games", href: "/library/games", label: "Games", minutes: gamesMinutes,
        stats: [{ label: "Total", value: total(games) }, { label: "Completed", value: c(games, "COMPLETED") }, { label: "Playing", value: c(games, "PLAYING") }],
      },
      {
        key: "manga", href: "/library/manga", label: "Manga", minutes: mangaMinutes,
        stats: [{ label: "Total", value: total(manga) }, { label: "Completed", value: c(manga, "COMPLETED") }, { label: "Reading", value: c(manga, "READING") }],
      },
      {
        key: "comics", href: "/library/comics", label: "Comics", minutes: comicsMinutes,
        stats: [{ label: "Titles", value: comicTitleCount }, { label: "Issues", value: comicIssueCount }, { label: "Read", value: comicReadCount }],
      },
      {
        key: "articles", href: "/library/articles", label: "Articles", minutes: articlesMinutes,
        stats: [{ label: "Total", value: total(articles) }, { label: "Read", value: c(articles, "READ") }, { label: "Queued", value: c(articles, "WANT_TO_READ") }],
      },
    ];

    return { sections, totalMinutes };
  },
  ["library-dashboard-stats"],
  { tags: ["library-stats"], revalidate: 3600 }
);

// The dashboard needs a live database, so it cannot be prerendered at build time. The real
// win here is unstable_cache + revalidateTag("library-stats"), which already avoids re-running
// these queries between mutations.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { sections, totalMinutes } = await getDashboardData();
  return <DashboardClient sections={sections} totalMinutes={totalMinutes} />;
}
