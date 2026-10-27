-- Books, Anime, TV and the Wardrobe are gone (owner, 2026-10-27).
--
-- Drops their ten tables — Book, BookSeries, BookUniverse, Anime, AnimeSeries, AnimeUniverse,
-- TvShow, TvSeries, TvUniverse, Garment — and the enums only they used.
--
-- DESTRUCTIVE: every book, anime, show and garment stored is deleted. On the new database
-- (October 2026) these tables were empty. To check before you drop:
--
--   SELECT (SELECT count(*) FROM "Book") AS books, (SELECT count(*) FROM "Anime") AS anime,
--          (SELECT count(*) FROM "TvShow") AS shows, (SELECT count(*) FROM "Garment") AS garments;
--
-- A REMOVAL: run it after the deploy carrying this change is live — the code deployed before it
-- still reads these tables. Nothing breaks if it is never run: the new code never touches them.
--
-- Idempotent: safe to run again.

BEGIN;

DROP TABLE IF EXISTS "Book", "BookSeries", "BookUniverse" CASCADE;
DROP TABLE IF EXISTS "Anime", "AnimeSeries", "AnimeUniverse" CASCADE;
DROP TABLE IF EXISTS "TvShow", "TvSeries", "TvUniverse" CASCADE;
DROP TABLE IF EXISTS "Garment" CASCADE;

DROP TYPE IF EXISTS "BookStatus", "AnimeStatus", "AnimeSeason", "TvStatus";
DROP TYPE IF EXISTS "GarmentType", "ColorGroup", "WashMethod", "WashTemp", "WashCycle", "SpinLevel", "DryMethod";

COMMIT;
