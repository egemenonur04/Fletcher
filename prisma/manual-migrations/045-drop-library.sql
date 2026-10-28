-- The Library is gone (owner, 2026-10-28): movies, games, manga, comics and articles.
--
-- Drops their tables — Movie, MovieUniverse, Game, Manga, ComicPublisher, ComicUniverse,
-- ComicTitle, ComicIssue, Article — and the enums only they used, Language among them.
--
-- DESTRUCTIVE: every film, game, manga, comic and article stored is deleted. To check first:
--
--   SELECT (SELECT count(*) FROM "Movie") AS movies, (SELECT count(*) FROM "Game") AS games,
--          (SELECT count(*) FROM "Manga") AS manga, (SELECT count(*) FROM "ComicIssue") AS issues,
--          (SELECT count(*) FROM "Article") AS articles;
--
-- A REMOVAL: run it after the deploy carrying this change is live. Nothing breaks if it is never
-- run: the new code never touches these tables.
--
-- Idempotent: safe to run again.

BEGIN;

DROP TABLE IF EXISTS "Movie", "MovieUniverse", "Game", "Manga", "Article" CASCADE;
DROP TABLE IF EXISTS "ComicIssue", "ComicTitle", "ComicUniverse", "ComicPublisher" CASCADE;

DROP TYPE IF EXISTS "MovieStatus", "GameStatus", "GamePlatform", "MangaFormat", "MangaStatus", "ArticleStatus", "Language";

COMMIT;
